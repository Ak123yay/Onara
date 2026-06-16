import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ProjectStatus = "queued" | "generating" | "deploying" | "live" | "failed" | "suspended";

type ProjectForDelete = {
  business_name: string;
  cloudflare_project_name: string | null;
  id: string;
  public_url: string | null;
  status: ProjectStatus;
};

type CloudflareDeleteResult =
  | { projectName: string | null; status: "deleted" | "skipped" }
  | { error: string; projectName: string; status: "failed" };

const ACTIVE_BUILD_STATUSES: ProjectStatus[] = ["queued", "generating", "deploying"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params;

  if (!UUID_RE.test(projectId)) {
    return NextResponse.json({ error: "invalid_project_id", message: "Project id is invalid." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: project, error: lookupError } = await db
    .from("projects")
    .select("id, business_name, status, cloudflare_project_name, public_url")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle<ProjectForDelete>();

  if (lookupError) {
    return NextResponse.json(
      { error: "project_lookup_failed", message: lookupError.message },
      { status: 500 },
    );
  }

  if (!project) {
    return NextResponse.json({ error: "not_found", message: "Site was not found." }, { status: 404 });
  }

  if (ACTIVE_BUILD_STATUSES.includes(project.status)) {
    return NextResponse.json(
      {
        error: "active_build_cannot_be_deleted",
        message: "This site is still building. Wait until it finishes or fails before deleting it.",
      },
      { status: 409 },
    );
  }

  const cloudflareResult = await deleteCloudflareProject(project);
  if (cloudflareResult.status === "failed") {
    return NextResponse.json(
      {
        error: "cloudflare_delete_failed",
        message: cloudflareResult.error,
        projectName: cloudflareResult.projectName,
      },
      { status: 502 },
    );
  }

  const { error: deleteError } = await db
    .from("projects")
    .delete()
    .eq("id", project.id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "project_delete_failed", message: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    cloudflareProjectName: cloudflareResult.projectName,
    cloudflareStatus: cloudflareResult.status,
    deleted: true,
    projectId: project.id,
  });
}

async function deleteCloudflareProject(project: ProjectForDelete): Promise<CloudflareDeleteResult> {
  const projectName = normalizedProjectName(project.cloudflare_project_name) ?? projectNameFromPagesUrl(project.public_url);

  if (!projectName) {
    return { projectName: null, status: "skipped" };
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

  if (!accountId || !apiToken) {
    return {
      error: "Cloudflare cleanup is not configured in the Next.js app environment.",
      projectName,
      status: "failed",
    };
  }

  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        method: "DELETE",
      },
    );
  } catch {
    return {
      error: "Cloudflare cleanup request failed before reaching Cloudflare.",
      projectName,
      status: "failed",
    };
  }

  if (response.status === 404) {
    return { projectName, status: "deleted" };
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !cloudflareSucceeded(payload)) {
    return {
      error: cloudflareErrorMessage(payload) ?? "Cloudflare Pages project could not be deleted.",
      projectName,
      status: "failed",
    };
  }

  return { projectName, status: "deleted" };
}

function normalizedProjectName(value: string | null) {
  const text = value?.trim();
  if (!text || !/^[a-z0-9][a-z0-9-]{0,62}$/i.test(text)) {
    return null;
  }

  return text;
}

function projectNameFromPagesUrl(value: string | null) {
  if (!value) {
    return null;
  }

  let hostname: string;
  try {
    hostname = new URL(value).hostname;
  } catch {
    return null;
  }

  if (!hostname.endsWith(".pages.dev")) {
    return null;
  }

  const parts = hostname.split(".");
  const projectName = parts.length >= 4 ? parts[parts.length - 3] : parts[0];
  return normalizedProjectName(projectName);
}

function cloudflareSucceeded(payload: unknown) {
  return isPlainObject(payload) && payload.success !== false;
}

function cloudflareErrorMessage(payload: unknown) {
  if (!isPlainObject(payload) || !Array.isArray(payload.errors) || payload.errors.length === 0) {
    return null;
  }

  return payload.errors
    .map((error) => (isPlainObject(error) && typeof error.message === "string" ? error.message : null))
    .filter(Boolean)
    .join("; ");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
