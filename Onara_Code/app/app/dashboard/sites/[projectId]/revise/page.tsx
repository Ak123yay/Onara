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
  revisions_limit: number;
  revisions_used: number;
};

type RevisionHistoryRow = {
  created_at: string;
  error_message: string | null;
  id: string;
  instruction: string;
  result_public_url: string | null;
  status: "pending" | "running" | "done" | "failed";
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
  const [{ data: project }, { data: profile }, { data: revisions }] = await Promise.all([
    db
      .from("projects")
      .select("id, business_name, public_url, status")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle<ProjectForRevisionPage>(),
    db
      .from("users")
      .select("revisions_used, revisions_limit")
      .eq("id", user.id)
      .maybeSingle<ProfileForRevisionPage>(),
    db
      .from("revisions")
      .select("id, instruction, status, created_at, result_public_url, error_message")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<RevisionHistoryRow[]>(),
  ]);

  if (!project) {
    redirect("/dashboard");
  }

  return (
    <main className="revision-page">
      <div className="revision-page-header">
        <div>
          <Link className="mono revision-back-link" href="/dashboard">
            ← Dashboard
          </Link>
          <p className="eyebrow">Phase 23 revision system</p>
          <h1 className="serif">Revise {project.business_name}</h1>
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
            Return to dashboard
          </Link>
        </section>
      ) : (
        <RevisionWorkspace
          latestRevisions={revisions ?? []}
          project={project}
          revisionsLimit={profile?.revisions_limit ?? 0}
          revisionsUsed={profile?.revisions_used ?? 0}
        />
      )}
    </main>
  );
}
