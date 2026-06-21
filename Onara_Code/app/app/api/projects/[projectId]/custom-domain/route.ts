import { NextResponse } from "next/server";
import { ensureCloudflareCustomDomain } from "@/lib/cloudflare/custom-domain";
import { customDomainFeatureEnabled } from "@/lib/custom-domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ProjectForDomain = {
  cloudflare_project_name: string | null;
  custom_domain: string | null;
  custom_domain_error: string | null;
  custom_domain_purchased_at: string | null;
  custom_domain_status: string;
  custom_domain_validation: Record<string, unknown> | null;
  id: string;
  public_url: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  if (!customDomainFeatureEnabled()) {
    return NextResponse.json({ error: "feature_disabled", message: "Custom domains are not enabled." }, { status: 404 });
  }

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
    .select(
      "id, public_url, cloudflare_project_name, custom_domain, custom_domain_status, custom_domain_purchased_at, custom_domain_error, custom_domain_validation",
    )
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle<ProjectForDomain>();

  if (lookupError) {
    return NextResponse.json({ error: "project_lookup_failed", message: lookupError.message }, { status: 500 });
  }

  if (!project) {
    return NextResponse.json({ error: "not_found", message: "Site was not found." }, { status: 404 });
  }

  if (!project.custom_domain || !project.custom_domain_purchased_at) {
    return NextResponse.json(domainResponse(project));
  }

  if (!project.cloudflare_project_name) {
    return NextResponse.json(
      { ...domainResponse(project), error: "Cloudflare project is unavailable.", status: "error" },
      { status: 409 },
    );
  }

  try {
    const result = await ensureCloudflareCustomDomain(project.cloudflare_project_name, project.custom_domain);
    const updateValues: Record<string, unknown> = {
      custom_domain_error: result.error,
      custom_domain_status: result.status,
      custom_domain_validation: result.validation,
      updated_at: new Date().toISOString(),
    };

    if (result.status === "active") {
      updateValues.public_url = `https://${project.custom_domain}`;
    }

    const { error: updateError } = await db
      .from("projects")
      .update(updateValues)
      .eq("id", project.id)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "project_update_failed", message: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      domain: project.custom_domain,
      error: result.error,
      purchased: true,
      status: result.status,
      validation: result.validation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloudflare domain status could not be checked.";
    await db
      .from("projects")
      .update({
        custom_domain_error: message,
        custom_domain_status: "error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id)
      .eq("user_id", user.id);

    return NextResponse.json(
      { ...domainResponse(project), error: message, status: "error" },
      { status: 502 },
    );
  }
}

function domainResponse(project: ProjectForDomain) {
  return {
    domain: project.custom_domain,
    error: project.custom_domain_error,
    purchased: Boolean(project.custom_domain_purchased_at),
    status: project.custom_domain_status,
    validation: project.custom_domain_validation ?? {},
  };
}
