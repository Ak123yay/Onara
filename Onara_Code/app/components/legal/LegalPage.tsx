import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

export type LegalSection = {
  title: string;
  body?: ReactNode;
  bullets?: ReactNode[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
};

export function LegalPage({ eyebrow, title, intro, updated, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10 lg:py-14">
        <Link
          className="mono inline-flex items-center gap-2 border border-rule bg-paper-2 px-4 py-3 text-xs text-ink-2 transition hover:border-accent hover:text-accent"
          href="/"
        >
          <ArrowLeft aria-hidden="true" size={14} />
          Back to Onara
        </Link>

        <header className="mt-12 border-b border-rule pb-10">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="serif mt-4 max-w-4xl text-[48px] leading-[0.98] tracking-[-0.05em] sm:text-[72px]">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-ink-2">{intro}</p>
          <div className="mono mt-7 inline-flex border border-rule bg-paper-2 px-3 py-2 text-xs text-ink-3">
            Last updated: {updated}
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-8 border border-rule bg-paper-2 p-4">
              <p className="mono text-xs text-ink-3">On this page</p>
              <nav className="mt-4 grid gap-2 text-sm text-ink-2">
                {sections.map((section) => (
                  <a className="hover:text-accent" href={`#${sectionId(section.title)}`} key={section.title}>
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="grid gap-5">
            {sections.map((section, index) => (
              <section className="border border-rule bg-paper-2 p-6 sm:p-8" id={sectionId(section.title)} key={section.title}>
                <div className="flex items-start gap-4">
                  <span className="mono flex size-9 shrink-0 items-center justify-center border border-rule bg-paper text-xs text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="serif text-3xl leading-tight tracking-[-0.04em]">{section.title}</h2>
                    {section.body ? <div className="legal-copy mt-4 text-ink-2">{section.body}</div> : null}
                    {section.bullets?.length ? (
                      <ul className="mt-5 grid gap-3 text-ink-2">
                        {section.bullets.map((item, itemIndex) => (
                          <li className="flex gap-3" key={itemIndex}>
                            <ShieldCheck aria-hidden="true" className="mt-1 shrink-0 text-accent" size={15} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </section>
            ))}

            <section className="flex flex-col gap-4 border border-rule bg-ink p-6 text-paper sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mono text-xs text-paper/60">Questions</p>
                <h2 className="serif mt-2 text-3xl tracking-[-0.04em]">Contact Onara</h2>
              </div>
              <a
                className="mono inline-flex items-center justify-center gap-2 border border-paper/20 bg-paper px-4 py-3 text-xs text-ink transition hover:bg-accent hover:text-paper"
                href="mailto:support@onara.tech"
              >
                <Mail aria-hidden="true" size={14} />
                support@onara.tech
              </a>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function sectionId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
