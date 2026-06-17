import Link from "next/link";
import { notFound } from "next/navigation";
import { RevisionWorkspace } from "@/components/revisions/RevisionWorkspace";

export default function DevRevisionWorkspacePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const createdAt = new Date().toISOString();
  const revisionId = "dev-revision-001";

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
            <p>Cardinal Plumbing Heating &amp; Air Inc</p>
          </div>
        </div>
        <Link className="btn btn-soft btn-sm" href="/dashboard">
          Back to sites
        </Link>
      </div>

      <RevisionWorkspace
        latestRevisions={[
          {
            affected_components: ["hero", "services", "shared_styles"],
            agent_summary: "I updated the hero, services, and shared spacing, then deployed the revision.",
            before_public_url: "https://example.com",
            changed_files: [
              {
                path: "components/hero.html",
                status: "modified",
                summary: "Larger CTA, stronger proof line, and tighter heading grouping.",
              },
              {
                path: "components/services.html",
                status: "modified",
                summary: "Compressed service cards and moved repeated proof copy out of the hero.",
              },
              {
                path: "components/shared.css",
                status: "modified",
                summary: "Adjusted section rhythm, mobile stacks, and button sizing.",
              },
              {
                path: "index.html",
                status: "assembled",
                summary: "Reassembled the deployed page from updated components.",
              },
            ],
            created_at: createdAt,
            error_message: null,
            id: revisionId,
            instruction: "Make the CTA bigger and make the services section less cramped.",
            parent_revision_id: null,
            result_public_url: "https://example.com",
            revision_kind: "edit",
            status: "done",
          },
        ]}
        messages={[
          {
            content: "Make the CTA bigger and make the services section less cramped.",
            created_at: createdAt,
            id: "dev-message-user",
            metadata: {},
            revision_id: revisionId,
            role: "user",
          },
          {
            content: "I updated the hero, services, and shared spacing, then deployed the revision.",
            created_at: createdAt,
            id: "dev-message-agent",
            metadata: {},
            revision_id: revisionId,
            role: "assistant",
          },
        ]}
        project={{
          business_name: "Cardinal Plumbing Heating & Air Inc",
          id: "00000000-0000-4000-8000-000000000023",
          public_url: "https://example.com",
          status: "live",
        }}
        planLabel="Starter"
        revisionsLimit={10}
        revisionsUsed={2}
      />
    </main>
  );
}
