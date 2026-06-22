import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  Globe2,
  HelpCircle,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  alternates: {
    canonical: "/help",
  },
  description:
    "Get help with Onara site generation, revisions, billing, public URLs, lead forms, and account support.",
  title: "Help",
};

const supportEmail = "support@onara.tech";
const supportHref =
  "mailto:support@onara.tech?subject=Onara%20support%20request&body=Account%20email%3A%0ASite%20name%20or%20URL%3A%0AWhat%20happened%3A%0AWhat%20you%20expected%3A";

const firstChecks = [
  "Open the dashboard and confirm the site status: Building, Live, Failed, or Paused.",
  "If a build is still running, use View live build instead of starting a duplicate build.",
  "If a site is live but the public URL is hidden, check Plan and billing.",
  "For revisions, send one clear request at a time and include the exact section to change.",
];

const generationSteps = [
  {
    title: "Search the Google Business Profile",
    text: "Use a real Google listing, not typed freeform text. Onara imports the business name, address, phone, photos, rating, reviews, and category from that listing.",
  },
  {
    title: "Confirm the imported business details",
    text: "Review phone, service area, hours, photos, and style direction before generating. Bad source data makes the generated site weaker.",
  },
  {
    title: "Wait for the pipeline to finish",
    text: "The agents write copy, plan sections, generate code, debug the page, add SEO, check mobile quality, back up code to GitHub, and deploy to Cloudflare.",
  },
  {
    title: "Use revision requests for small corrections",
    text: "Ask for focused changes such as 'make the hero call button larger' or 'rewrite the service area section for Arlington and Alexandria.'",
  },
];

const faqGroups = [
  {
    icon: <Sparkles size={18} />,
    kicker: "Builds",
    title: "Site generation",
    questions: [
      {
        q: "Why is my site still building?",
        a: "Generation can take longer when the pipeline is waiting on AI providers, image resolution, Cloudflare deployment, or GitHub backup. If the progress screen is still updating, let it finish.",
      },
      {
        q: "What should I do if a build fails?",
        a: "Open the site card and use Retry if it appears. If it keeps failing, email support with the business name, project URL, and the visible error message.",
      },
      {
        q: "Can I build multiple sites?",
        a: "Free and Starter plans allow one active site. Trial and Pro allow three active sites. Deleting a finished or failed site frees the slot.",
      },
    ],
  },
  {
    icon: <RefreshCw size={18} />,
    kicker: "Revisions",
    title: "Changing a generated site",
    questions: [
      {
        q: "What makes a good revision request?",
        a: "Be specific: name the section, say what should change, and avoid stacking unrelated requests. Example: 'Make the hero CTA say Call for emergency plumbing and move reviews above services.'",
      },
      {
        q: "Do revisions affect my plan?",
        a: "Free has limited revisions, Starter has normal monthly revisions, and Trial or Pro has unlimited revisions. Failed revision runs do not deduct usage.",
      },
      {
        q: "Can I undo a bad revision?",
        a: "Use revision history when available. Onara stores source history through the GitHub-backed deployment path so rollback can restore prior generated files.",
      },
    ],
  },
  {
    icon: <CreditCard size={18} />,
    kicker: "Billing",
    title: "Plans, trials, and public URLs",
    questions: [
      {
        q: "What happens during the trial?",
        a: "New users receive Pro-level access for 14 days without a credit card. When the trial ends, free limits apply unless a paid plan is active.",
      },
      {
        q: "Why did my public URL disappear?",
        a: "Public URL visibility is a paid feature. If billing is canceled, past due, or the trial ended, the dashboard keeps the project record but hides or suspends the public site.",
      },
      {
        q: "Which plan includes code download?",
        a: "Trial and Pro users can download a zip folder of generated site files from the dashboard when a site is live and backed up.",
      },
    ],
  },
  {
    icon: <Globe2 size={18} />,
    kicker: "Live sites",
    title: "Published pages and leads",
    questions: [
      {
        q: "Where does my site deploy?",
        a: "Onara deploys generated sites to Cloudflare Pages. The dashboard stores the public URL, build status, deployment history, and GitHub backup path.",
      },
      {
        q: "How do contact forms work?",
        a: "Generated sites include a contact form when the generated layout uses one. Submissions send a lead email to the business email, falling back to the account email when configured.",
      },
      {
        q: "Can Onara update Google Business Profile data automatically?",
        a: "Not in v1. Lead email and review badge refresh are the current retention features. GBP polling/change detection stays disabled until a later version.",
      },
    ],
  },
];

const supportReasons = [
  "A build failed more than once",
  "A paid plan is active but public URL access is wrong",
  "Checkout succeeded but the dashboard did not update",
  "A generated site shows incorrect business information",
  "A lead email did not arrive after a contact form test",
];

const heroStats = [
  { label: "First check", value: "Site status" },
  { label: "Best detail", value: "Public URL" },
  { label: "Support", value: "Email ready" },
];

const supportPacket = [
  "Account email",
  "Site name or public URL",
  "Screenshot or copied error",
  "Last button or action used",
];

export default function HelpPage() {
  return (
    <div className="help-page">
      <header className="help-header">
        <div>
          <p className="eyebrow">Help center</p>
          <h1 className="serif">Get unstuck fast.</h1>
          <p>
            Practical help for building, revising, billing, downloading code, and keeping generated
            Onara sites online.
          </p>
        </div>
        <Link className="help-header-link" href="/dashboard">
          Open dashboard
          <ArrowRight aria-hidden="true" size={13} />
        </Link>
      </header>

      <section className="help-hero card">
        <div className="help-hero-main">
          <span className="help-hero-icon" aria-hidden="true">
            <HelpCircle size={24} />
          </span>
          <p className="eyebrow">Start here</p>
          <h2 className="serif">Most Onara issues come from status, plan, or source data.</h2>
          <p>
            Before emailing support, check the project status and the plan state. That usually tells
            you whether the next move is wait, retry, revise, upgrade, or contact support.
          </p>
          <div className="help-hero-stats" aria-label="Support shortcuts">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="help-hero-checklist">
          <p className="eyebrow">Quick checks</p>
          <ul>
            {firstChecks.map((item) => (
              <li key={item}>
                <CheckCircle2 aria-hidden="true" size={15} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="help-quick-grid" aria-label="Common help actions">
        <HelpAction
          description="Review current access, trial status, public URL visibility, and checkout options."
          href="/account/billing"
          icon={<CreditCard size={18} />}
          label="Billing"
          title="Plan and billing"
        />
        <HelpAction
          description="Go back to your generated sites, copy public links, retry failed builds, or revise live sites."
          href="/dashboard"
          icon={<Globe2 size={18} />}
          label="Workspace"
          title="Open dashboard"
        />
        <HelpAction
          description="Send a support email with the right details already requested in the message body."
          href={supportHref}
          icon={<Mail size={18} />}
          label="Support"
          title="Email support"
        />
      </section>

      <div className="help-layout">
        <main className="help-main">
          <section className="help-section help-process-section card">
            <div className="help-section-heading">
              <span className="help-section-icon" aria-hidden="true">
                <BookOpen size={17} />
              </span>
              <div>
                <p className="eyebrow">How Onara works</p>
                <h2 className="serif">From Google listing to live site</h2>
              </div>
            </div>
            <div className="help-flow">
              {generationSteps.map((step, index) => (
                <article className="help-flow-step" key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {faqGroups.map((group) => (
            <section className="help-section card" key={group.title}>
              <div className="help-section-heading">
                <span className="help-section-icon" aria-hidden="true">
                  {group.icon}
                </span>
                <div>
                  <p className="eyebrow">{group.kicker}</p>
                  <h2 className="serif">{group.title}</h2>
                </div>
              </div>
              <div className="help-faq-list">
                {group.questions.map((question, index) => (
                  <article className="help-faq-item" key={question.q}>
                    <span className="help-faq-number">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{question.q}</h3>
                      <p>{question.a}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </main>

        <aside className="help-aside" aria-label="Support details">
          <section className="help-contact-card">
            <div>
              <p className="eyebrow">Direct support</p>
              <h2 className="serif">Need a human?</h2>
              <p>
                Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. Include the site name,
                account email, and the exact action that failed.
              </p>
            </div>
            <Link className="help-contact-button" href={supportHref}>
              <Send aria-hidden="true" size={15} />
              Email support
            </Link>
          </section>

          <section className="help-aside-card help-packet-card card">
            <p className="eyebrow">Support packet</p>
            <h3>Send these four things</h3>
            <ol>
              {supportPacket.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>

          <section className="help-aside-card card">
            <p className="eyebrow">When to email</p>
            <ul className="help-support-list">
              {supportReasons.map((reason) => (
                <li key={reason}>
                  <AlertTriangle aria-hidden="true" size={14} />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="help-aside-card card">
            <p className="eyebrow">Useful links</p>
            <div className="help-link-list">
              <Link href="/account/billing">
                <CreditCard aria-hidden="true" size={14} />
                Billing and plans
              </Link>
              <Link href="/dashboard/build">
                <Sparkles aria-hidden="true" size={14} />
                Build a new site
              </Link>
              <Link href="/dashboard">
                <Wrench aria-hidden="true" size={14} />
                Manage generated sites
              </Link>
              <Link href="/account">
                <ShieldCheck aria-hidden="true" size={14} />
                Account settings
              </Link>
            </div>
          </section>

          <section className="help-aside-card help-pro-card card">
            <p className="eyebrow">Pro feature</p>
            <h3 className="serif">Code download</h3>
            <p>
              Trial and Pro users can download a folder zip from a live site card after Onara has
              backed up the generated files.
            </p>
            <span>
              <Download aria-hidden="true" size={14} />
              Live sites only
            </span>
          </section>
        </aside>
      </div>

      <section className="help-footer-strip card">
        <ExternalLink aria-hidden="true" size={16} />
        <p>
          Support is fastest when you include the account email, project or public URL, screenshot,
          and the exact button or step that failed.
        </p>
        <Link href={supportHref}>
          Contact support
          <ArrowRight aria-hidden="true" size={13} />
        </Link>
      </section>
    </div>
  );
}

function HelpAction({
  description,
  href,
  icon,
  label,
  title,
}: {
  description: string;
  href: string;
  icon: ReactNode;
  label: string;
  title: string;
}) {
  return (
    <Link className="help-action card" href={href}>
      <span className="help-action-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="help-action-copy">
        <span className="eyebrow">{label}</span>
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <ArrowRight aria-hidden="true" size={15} />
    </Link>
  );
}
