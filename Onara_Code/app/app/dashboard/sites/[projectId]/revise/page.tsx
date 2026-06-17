import Link from "next/link";
import { redirect } from "next/navigation";
import { RevisionWorkspace } from "@/components/revisions/RevisionWorkspace";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ProjectForRevisionPage = {
  business_name: string;
  id: string;
  public_url: string | null;
  status: string;
};

type ProfileForRevisionPage = {
  plan: string | null;
  revisions_limit: number;
  revisions_used: number;
};

type RevisionHistoryRow = {
  affected_components: string[] | null;
  agent_summary: string | null;
  before_public_url: string | null;
  changed_files: Array<Record<string, unknown>> | null;
  created_at: string;
  error_message: string | null;
  id: string;
  instruction: string;
  parent_revision_id: string | null;
  revision_kind: "edit" | "rollback";
  result_public_url: string | null;
  status: "pending" | "running" | "done" | "failed";
};

type RevisionMessageRow = {
  content: string;
  created_at: string;
  id: string;
  metadata: Record<string, unknown>;
  revision_id: string;
  role: "user" | "assistant" | "system";
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ReviseSitePage(
  props: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await props.params;

  if (!UUID_RE.test(projectId)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/dashboard/sites/${encodeURIComponent(projectId)}/revise`);
  }

  const db = createAdminClient();
  const [{ data: project }, { data: profile }, { data: revisions }, { data: messages }] = await Promise.all([
    db
      .from("projects")
      .select("id, business_name, public_url, status")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle<ProjectForRevisionPage>(),
    db
      .from("users")
      .select("plan, revisions_used, revisions_limit")
      .eq("id", user.id)
      .maybeSingle<ProfileForRevisionPage>(),
    db
      .from("revisions")
      .select(
        "id, instruction, status, created_at, result_public_url, error_message, affected_components, before_public_url, changed_files, agent_summary, revision_kind, parent_revision_id",
      )
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<RevisionHistoryRow[]>(),
    db
      .from("revision_messages")
      .select("id, revision_id, role, content, metadata, created_at")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(40)
      .returns<RevisionMessageRow[]>(),
  ]);

  if (!project) {
    redirect("/dashboard");
  }

  return (
    <main className="revision-page">
      <div className="revision-page-header">
        <div className="revision-page-brand">
          <Link className="onara-logo revision-page-logo" href="/dashboard">
            <span className="onara-logo-mark" aria-hidden="true">
              <span className="onara-logo-dot" />
            </span>
            <span className="onara-logo-word">Onara</span>
          </Link>
          <span className="revision-page-divider" aria-hidden="true" />
          <div className="revision-page-title">
            <h1 className="serif">Revision studio</h1>
            <p>{project.business_name}</p>
          </div>
        </div>
        <Link className="btn btn-soft btn-sm" href="/dashboard">
          Back to sites
        </Link>
      </div>

      {project.status !== "live" ? (
        <section className="revision-unavailable">
          <p className="mono">Revision unavailable</p>
          <h2 className="serif">This site is not live yet.</h2>
          <p>Finish the build or retry the failed build before requesting a revision.</p>
          <Link className="btn btn-accent" href="/dashboard">
            &larr; Dashboard
          </Link>
        </section>
      ) : (
        <RevisionWorkspace
          latestRevisions={revisions ?? []}
          messages={messages ?? []}
          planLabel={profile?.plan ?? null}
          project={project}
          revisionsLimit={profile?.revisions_limit ?? 0}
          revisionsUsed={profile?.revisions_used ?? 0}
        />
      )}
    </main>
  );
}
