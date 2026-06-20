"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Check,
  Clock3,
  Globe2,
  Hammer,
  MapPin,
  Phone,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { AuthNav } from "@/components/auth/AuthNav";
import { Badge, Card } from "@/components/ui";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Step = {
  eyebrow: string;
  title: string;
  body: string;
  icon: LucideIcon;
  note: string;
};

type PricePlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

const steps: Step[] = [
  {
    eyebrow: "Step 01",
    title: "Find your business",
    body: "Type your business name. Onara pulls the real Google listing: address, hours, phone, photos, and review signals.",
    icon: Search,
    note: "About 10 seconds",
  },
  {
    eyebrow: "Step 02",
    title: "We build the contractor site",
    body: "The system writes the copy, picks a trustworthy trade palette, adds service areas, and prepares phone-first CTAs.",
    icon: Sparkles,
    note: "About 80 seconds",
  },
  {
    eyebrow: "Step 03",
    title: "Go live instantly",
    body: "Your site gets a real URL, ready for business cards, Facebook groups, Google profile updates, and customer texts.",
    icon: Globe2,
    note: "Instant URL",
  },
];

const pricing: PricePlan[] = [
  {
    name: "Free",
    price: "$0",
    period: "14 days",
    description: "Try the full workflow before paying.",
    features: [
      "Full Pro trial, no card required",
      "Generate your first contractor site",
      "Dashboard preview stays available",
      "Good for testing the flow",
    ],
    cta: "Start free",
  },
  {
    name: "Starter",
    price: "$12",
    period: "/mo or $99/yr",
    description: "For one local contractor business.",
    features: [
      "1 live website",
      "10 revisions per month",
      "SEO structure included",
      "Remove Onara branding",
      "Upgrade or cancel anytime",
    ],
    cta: "Try Starter",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For multi-location operators and agencies.",
    features: [
      "3 live websites",
      "Unlimited revisions",
      "Priority generation queue",
      "Download code",
      "Model picker support later",
    ],
    cta: "Choose Pro",
  },
];

const testimonials = [
  {
    quote:
      "I had a website in 2 minutes. My competitor took 3 months to build theirs.",
    name: "Placeholder",
    role: "HVAC Contractor",
    initials: "HV",
  },
  {
    quote: "My customers can finally find my hours online without calling me.",
    name: "James T.",
    role: "Plumber",
    initials: "JT",
  },
  {
    quote:
      "I did not know what a website even cost. This is less than my phone bill.",
    name: "Placeholder",
    role: "Landscaper",
    initials: "LS",
  },
];

const faqs = [
  {
    q: "Do I need to know how to code?",
    a: "No. You type your business name, confirm the imported details, and Onara builds the site.",
  },
  {
    q: "What if Google has the wrong information?",
    a: "You confirm the imported data before generation. Missing or wrong fields can be fixed manually before the site is built.",
  },
  {
    q: "Can I use my own domain?",
    a: "Custom domains are coming soon. For now, you get a professional Onara-hosted URL.",
  },
  {
    q: "What happens after the trial ends?",
    a: "Your dashboard preview remains available. A public live URL requires Starter or Pro.",
  },
];

const proofItems = [
  {
    label: "Launch focus",
    value: "DC / Northern Virginia",
    icon: MapPin,
  },
  {
    label: "Import source",
    value: "Google Business Profile",
    icon: Search,
  },
  {
    label: "Primary action",
    value: "Phone-first CTAs",
    icon: Phone,
  },
  {
    label: "Trial",
    value: "14-day Pro access",
    icon: Sparkles,
  },
];

const buildAgents = [
  ["Analyst", "GBP facts imported", "done"],
  ["Copywriter", "Service copy drafted", "done"],
  ["Designer", "Trust layout selected", "active"],
  ["SEO QA", "Local schema queued", "pending"],
  ["Deploy", "URL reserved", "pending"],
];

const trustKit = [
  "License and insurance strip",
  "Google review badge",
  "Service-area map copy",
  "Tap-to-call estimate CTA",
];

const heroStats = [
  ["90 sec", "from search to draft"],
  ["No code", "built for busy owners"],
  ["Phone-first", "made for local calls"],
];

const contractorStyles = [
  {
    title: "Emergency-first plumber",
    category: "Plumbing",
    body: "High-contrast hero, orange alert bar, tap-to-call CTA, and service cards that make urgent calls obvious.",
    icon: Wrench,
    panelClass: "bg-contractor-navy text-white",
    accentClass: "bg-contractor-orange",
  },
  {
    title: "Trust-led roof repair",
    category: "Roofing",
    body: "License proof, storm repair messaging, estimate blocks, and local-area confidence before the first call.",
    icon: ShieldCheck,
    panelClass: "bg-contractor-cream text-contractor-navy",
    accentClass: "bg-contractor-trust",
  },
  {
    title: "Clean local HVAC",
    category: "HVAC",
    body: "Seasonal service framing, maintenance plan cards, review snippets, and mobile booking actions.",
    icon: Hammer,
    panelClass: "bg-ink text-paper",
    accentClass: "bg-accent",
  },
];

function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <div
      className={className}
      data-gsap-delay={delay}
      data-gsap-reveal
      data-gsap-y={y}
    >
      {children}
    </div>
  );
}

function Stagger({
  children,
  className,
  delayChildren = 0,
}: {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
}) {
  return (
    <div
      className={className}
      data-gsap-delay={delayChildren}
      data-gsap-stagger
    >
      {children}
    </div>
  );
}

function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      data-gsap-stagger-item
    >
      {children}
    </div>
  );
}

function FloatElement({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

function clearRenderEffects(element: HTMLElement) {
  element.style.removeProperty("filter");
  element.style.removeProperty("rotate");
  element.style.removeProperty("scale");
  element.style.removeProperty("transform");
  element.style.removeProperty("translate");
}

function Logo() {
  return (
    <Link href="/" className="onara-logo" aria-label="Onara home">
      <span className="onara-logo-mark" aria-hidden="true">
        <span className="onara-logo-dot" />
      </span>
      <span>Onara</span>
    </Link>
  );
}

function ProofStrip() {
  return (
    <section className="border-y border-rule-2 bg-paper px-5 py-8 sm:px-10">
      <Stagger className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {proofItems.map((item) => {
          const Icon = item.icon;

          return (
            <StaggerItem key={item.label}>
              <div
                className="flex items-center gap-3 rounded-card border border-rule-2 bg-paper-2/70 p-4"
                data-gsap-hover
                data-gsap-hover-y="-3"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="mono block">{item.label}</span>
                  <span className="mt-1 block text-sm font-medium text-ink">
                    {item.value}
                  </span>
                </span>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="serif mt-4 text-[42px] leading-[1.02] tracking-[-0.04em] text-ink sm:text-[56px]">
        {title}
      </h2>
      {body ? (
        <p className="mt-5 text-[15px] leading-7 text-ink-3 sm:text-base">{body}</p>
      ) : null}
    </div>
  );
}

function AgentProgressCard() {
  return (
    <Card className="p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <p className="mono text-ink-3">Agent build queue</p>
        <span className="rounded-full bg-leaf-soft px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-leaf">
          live
        </span>
      </div>
      <div className="mt-4 grid gap-2">
        {buildAgents.map(([name, status, state]) => (
          <div
            className={
              state === "active"
                ? "flex items-center gap-3 rounded-card bg-accent-softer px-3 py-2"
                : "flex items-center gap-3 rounded-card px-3 py-2"
            }
            key={name}
          >
            <span
              className={
                state === "done"
                  ? "size-2 rounded-full bg-ink"
                  : state === "active"
                    ? "size-2 rounded-full bg-accent shadow-[0_0_0_4px_oklch(0.62_0.13_50_/_0.16)]"
                    : "size-2 rounded-full bg-ink-5"
              }
            />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-ink">{name}</span>
              <span className="block truncate text-[11px] text-ink-3">
                {status}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-paper-3">
        <div className="h-full w-[64%] rounded-full bg-accent" />
      </div>
    </Card>
  );
}

function TrustKitCard() {
  return (
    <Card className="p-4 shadow-panel" variant="contractor">
      <div className="flex items-center justify-between">
        <p className="mono text-contractor-steel">Contractor trust kit</p>
        <ShieldCheck className="size-4 text-contractor-trust" />
      </div>
      <div className="mt-4 grid gap-2">
        {trustKit.map((item) => (
          <div
            className="flex items-center gap-2 rounded-card border border-contractor-steel/20 bg-white/55 px-3 py-2 text-xs font-medium"
            key={item}
          >
            <Check className="size-3.5 shrink-0 text-contractor-orange" />
            {item}
          </div>
        ))}
      </div>
    </Card>
  );
}

function BrowserChrome({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-panel border border-rule bg-paper shadow-lift">
      <div className="flex items-center gap-2 border-b border-rule-2 bg-paper-2 px-4 py-3">
        <span className="size-2.5 rounded-full bg-danger" />
        <span className="size-2.5 rounded-full bg-warn" />
        <span className="size-2.5 rounded-full bg-leaf" />
        <div className="ml-3 flex-1 rounded-badge border border-rule bg-paper px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
          nova-pro-plumbing.onara.site
        </div>
      </div>
      {children}
    </div>
  );
}

function ContractorPreview() {
  return (
    <BrowserChrome>
      <div className="bg-contractor-navy text-white">
        <div className="flex items-center justify-between gap-4 bg-contractor-orange px-5 py-3 text-sm font-semibold text-white">
          <span>Burst pipe? We can be there today.</span>
          <span className="font-mono text-xs tracking-[0.08em]">24 / 7 emergency</span>
        </div>
        <div className="grid gap-8 px-6 py-7 sm:grid-cols-[1.05fr_0.95fr] sm:px-8 sm:py-9">
          <div>
            <div className="inline-flex items-center gap-2 rounded-badge border border-white/15 bg-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-contractor-sand">
              <Star className="size-3 fill-contractor-orange text-contractor-orange" />
              4.8 from 127 Google reviews
            </div>
            <h3 className="serif mt-5 text-[42px] leading-[0.98] tracking-[-0.04em]">
              Fast plumbing help across Northern Virginia.
            </h3>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/72">
              Licensed, insured, and built for homeowners who need the phone number
              before they need a paragraph.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-control bg-contractor-orange px-4 py-3 text-sm font-semibold">
                <Phone className="size-4" />
                (703) 555-0182
              </span>
              <span className="inline-flex items-center gap-2 rounded-control border border-white/18 px-4 py-3 text-sm">
                Free estimate
              </span>
            </div>
          </div>
          <div className="grid gap-3">
            {["Emergency repair", "Water heaters", "Drain cleaning", "Leak detection"].map(
              (service) => (
                <div
                  className="flex items-center justify-between rounded-card border border-white/12 bg-white/8 px-4 py-3 text-sm"
                  key={service}
                >
                  {service}
                  <Check className="size-4 text-contractor-orange" />
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

function HeroShowcase() {
  return (
    <div className="hero-showcase-shell">
      <FloatElement
        className="hero-showcase-card hero-showcase-card-left"
      >
        <AgentProgressCard />
      </FloatElement>
      <FloatElement
        className="hero-showcase-card hero-showcase-card-right"
      >
        <TrustKitCard />
      </FloatElement>

      <div
        className="hero-showcase-preview"
      >
        <ContractorPreview />
      </div>

      <Stagger
        className="hero-showcase-stats"
        delayChildren={0.25}
      >
        {heroStats.map(([value, label]) => (
          <StaggerItem key={value}>
            <div
              className="hero-showcase-stat"
              data-gsap-hover
              data-gsap-hover-y="-4"
            >
              <span className="serif block text-3xl leading-none tracking-[-0.04em] text-ink">
                {value}
              </span>
              <span className="mono mt-2 block">{label}</span>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

function ContractorStyleGallery() {
  return (
    <section className="border-y border-rule-2 bg-paper-2 px-5 py-20 sm:px-10 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Generated contractor styles"
            title="Not a generic template."
            body="The design reference is flexible enough to create different contractor looks while keeping the same Onara system: strong type, paper texture, crisp cards, and practical CTAs."
          />
          <Badge variant="contractor">Design-system ready</Badge>
        </Reveal>

        <Stagger className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
          {contractorStyles.map((style) => {
            const Icon = style.icon;

            return (
              <StaggerItem className="h-full" key={style.title}>
                <div className="h-full" data-gsap-hover data-gsap-hover-y="-6">
                  <Card className="flex h-full flex-col overflow-hidden" interactive>
                    <div className={`${style.panelClass} min-h-[292px] p-5`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`grid size-9 place-items-center rounded-full ${style.accentClass} text-white`}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.1em] opacity-70">
                            {style.category}
                          </span>
                        </div>
                        <span className={`size-4 rounded-full ${style.accentClass}`} />
                      </div>

                      <div className="mt-12 max-w-[260px]">
                        <div className="serif text-[34px] leading-[0.96] tracking-[-0.045em]">
                          {style.title}
                        </div>
                        <div className="mt-5 grid gap-2">
                          <span className={`h-2 w-28 rounded-full ${style.accentClass}`} />
                          <span className="h-2 w-44 rounded-full bg-current opacity-20" />
                          <span className="h-2 w-36 rounded-full bg-current opacity-20" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-5">
                      <p className="text-sm leading-6 text-ink-3">{style.body}</p>
                    </div>
                  </Card>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

export function LandingPage() {
  const pageRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const [heroQuery, setHeroQuery] = useState("");

  function submitHeroSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = heroQuery.trim();
    const buildPath = trimmedQuery
      ? `/dashboard/build?query=${encodeURIComponent(trimmedQuery)}`
      : "/dashboard/build";

    router.push(`/auth/signup?next=${encodeURIComponent(buildPath)}`);
  }

  useGSAP(
    () => {
      const root = pageRef.current;

      if (!root) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        root.classList.remove("gsap-landing-preload");
        gsap.set(
          root.querySelectorAll(
            "[data-gsap-reveal], [data-gsap-stagger-item], [data-gsap-hero-item], [data-gsap-hero-showcase], [data-gsap-showcase-piece]",
          ),
          { clearProps: "all" },
        );
        return;
      }

      const cleanups: Array<() => void> = [];
      const introTargets = root.querySelectorAll(
        "[data-gsap-nav], [data-gsap-hero-item], [data-gsap-hero-showcase], [data-gsap-showcase-piece]",
      );

      gsap.globalTimeline.paused(false);
      gsap.ticker.wake();

      gsap.set(root.querySelectorAll("[data-gsap-nav]"), {
        opacity: 0,
        y: -18,
      });
      gsap.set(root.querySelectorAll("[data-gsap-hero-item]"), {
        filter: "blur(8px)",
        opacity: 0,
        y: 24,
      });
      gsap.set(root.querySelectorAll("[data-gsap-hero-showcase]"), {
        filter: "blur(8px)",
        opacity: 0,
        y: 32,
      });
      gsap.set(root.querySelectorAll("[data-gsap-showcase-piece]"), {
        filter: "blur(8px)",
        opacity: 0,
        y: 18,
      });
      gsap.utils.toArray<HTMLElement>("[data-gsap-reveal]").forEach((el) => {
        gsap.set(el, {
          filter: "blur(8px)",
          opacity: 0,
          y: Number(el.dataset.gsapY ?? 24),
        });
      });
      gsap.set(root.querySelectorAll("[data-gsap-stagger-item]"), {
        opacity: 0,
        y: 18,
      });
      root.classList.remove("gsap-landing-preload");

      const introTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      introTimeline
        .fromTo(
          "[data-gsap-nav]",
          {
            opacity: 0,
            y: -18,
          },
          {
            duration: 0.55,
            opacity: 1,
            y: 0,
          },
        )
        .fromTo(
          "[data-gsap-hero-item]",
          {
            filter: "blur(8px)",
            opacity: 0,
            y: 24,
          },
          {
            clearProps: "filter,transform",
            duration: 0.72,
            filter: "blur(0px)",
            opacity: 1,
            stagger: 0.09,
            y: 0,
          },
          "-=0.15",
        )
        .fromTo(
          "[data-gsap-hero-showcase]",
          {
            filter: "blur(8px)",
            opacity: 0,
            y: 32,
          },
          {
            clearProps: "filter,transform",
            duration: 0.8,
            filter: "blur(0px)",
            opacity: 1,
            y: 0,
          },
          "-=0.25",
        )
        .fromTo(
          "[data-gsap-showcase-piece]",
          {
            filter: "blur(8px)",
            opacity: 0,
            y: 18,
          },
          {
            clearProps: "filter,transform",
            duration: 0.62,
            filter: "blur(0px)",
            opacity: 1,
            stagger: 0,
            y: 0,
          },
          "<",
        );

      introTimeline.eventCallback("onComplete", () => {
        introTargets.forEach((target) => {
          if (target instanceof HTMLElement) {
            clearRenderEffects(target);
          }
        });
      });

      gsap.to("[data-gsap-glow='right']", {
        duration: 6,
        ease: "sine.inOut",
        opacity: 1,
        repeat: -1,
        scale: 1.08,
        yoyo: true,
      });

      gsap.to("[data-gsap-glow='left']", {
        delay: 1.2,
        duration: 6.5,
        ease: "sine.inOut",
        opacity: 0.85,
        repeat: -1,
        scale: 1.1,
        yoyo: true,
      });

      gsap.utils.toArray<HTMLElement>("[data-gsap-reveal]").forEach((el) => {
        const delay = Number(el.dataset.gsapDelay ?? 0);
        const y = Number(el.dataset.gsapY ?? 24);

        gsap.fromTo(
          el,
          {
            filter: "blur(8px)",
            opacity: 0,
            y,
          },
          {
            clearProps: "filter,transform",
            delay,
            duration: 0.7,
            ease: "power3.out",
            filter: "blur(0px)",
            opacity: 1,
            onComplete: () => {
              clearRenderEffects(el);
            },
            scrollTrigger: {
              once: true,
              start: "top 82%",
              trigger: el,
            },
            y: 0,
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-gsap-stagger]").forEach((group) => {
        const delay = Number(group.dataset.gsapDelay ?? 0);
        const items = group.querySelectorAll("[data-gsap-stagger-item]");

        gsap.fromTo(
          items,
          {
            opacity: 0,
            y: 18,
          },
          {
            delay,
            duration: 0.55,
            ease: "power3.out",
            opacity: 1,
            scrollTrigger: {
              once: true,
              start: "top 82%",
              trigger: group,
            },
            stagger: 0.08,
            y: 0,
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-gsap-hover]").forEach((el) => {
        const x = Number(el.dataset.gsapHoverX ?? 0);
        const y = Number(el.dataset.gsapHoverY ?? 0);
        const scale = Number(el.dataset.gsapHoverScale ?? 1);
        const reset = { duration: 0.22, ease: "power3.out", scale: 1, x: 0, y: 0 };
        const lift = { duration: 0.22, ease: "power3.out", scale, x, y };
        const onEnter = () => gsap.to(el, lift);
        const onLeave = () => gsap.to(el, reset);

        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);

        cleanups.push(() => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
        });
      });

      gsap.to("[data-gsap-pulse]", {
        boxShadow: "0 0 0 18px rgb(255 255 255 / 0)",
        duration: 1.2,
        ease: "power2.out",
        repeat: -1,
        yoyo: true,
      });

      const introFallback = window.setTimeout(() => {
        introTargets.forEach((target) => {
          if (target instanceof HTMLElement) {
            target.style.opacity = "1";
            clearRenderEffects(target);
          }
        });
      }, 2600);

      cleanups.push(() => {
        window.clearTimeout(introFallback);
      });

      return () => {
        cleanups.forEach((cleanup) => cleanup());
      };
    },
    { scope: pageRef },
  );

  return (
    <main className="paper min-h-screen overflow-hidden gsap-landing-page gsap-landing-preload" ref={pageRef}>
      <noscript>
        <style>{`
          .gsap-landing-page [data-gsap-nav],
          .gsap-landing-page [data-gsap-hero-item],
          .gsap-landing-page [data-gsap-hero-showcase],
          .gsap-landing-page [data-gsap-showcase-piece],
          .gsap-landing-page [data-gsap-reveal],
          .gsap-landing-page [data-gsap-stagger-item] {
            opacity: 1 !important;
            filter: none !important;
            transform: none !important;
          }
        `}</style>
      </noscript>
      <header
        className="nav"
        data-gsap-nav
      >
        <AuthLogo />
        <nav className="nav-links">
          <a className="hidden sm:inline" href="#how">
            How it works
          </a>
          <a className="hidden sm:inline" href="#pricing">
            Pricing
          </a>
          <a className="hidden md:inline" href="#demo">
            Demo
          </a>
          <AuthNav />
        </nav>
      </header>

      <section className="relative px-5 py-20 text-center sm:px-10 sm:py-24 lg:py-28">
        <div
          className="absolute -right-24 -top-32 size-[460px] rounded-full bg-accent-softer blur-3xl"
          data-gsap-glow="right"
        />
        <div
          className="absolute -left-24 top-60 size-[300px] rounded-full bg-leaf-soft/70 blur-3xl"
          data-gsap-glow="left"
        />

        <div className="relative z-[1] mx-auto max-w-6xl">
          <div
            className="mono inline-flex items-center gap-2 rounded-full border border-rule-2 bg-paper px-4 py-2"
            data-gsap-hero-item
          >
            Early access for DC and Northern Virginia contractors
          </div>

          <h1
            className="serif mx-auto mt-7 max-w-6xl text-[58px] leading-[0.95] tracking-[-0.04em] text-ink sm:text-[82px] lg:text-[104px]"
            data-gsap-hero-item
          >
            A Google profile isn&apos;t enough.
            <br />
            <span className="hand-u serif-italic font-light text-accent-ink">
              We build your website
            </span>{" "}
            in 90 seconds.
          </h1>

          <p
            className="mx-auto mt-7 max-w-2xl text-[17px] leading-8 text-ink-3"
            data-gsap-hero-item
          >
            We pull your info from Google Maps - hours, photos, description, and
            reviews - then turn it into a professional contractor site with phone
            CTAs, service areas, trust badges, and clean local SEO.
          </p>

          <form
            onSubmit={submitHeroSearch}
            className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-card border border-ink bg-paper p-2 shadow-lift sm:flex-row sm:items-center"
            data-gsap-hero-item
            data-gsap-hover
            data-gsap-hover-y="-2"
          >
            <label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left">
              <Search className="size-5 shrink-0 text-ink-4" aria-hidden="true" />
              <input
                aria-label="Search for your business"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
                name="query"
                onChange={(event) => setHeroQuery(event.target.value)}
                placeholder="Search for your business..."
                type="search"
                value={heroQuery}
              />
            </label>
            <div data-gsap-hover data-gsap-hover-scale="0.98">
              <button className="btn btn-accent btn-lg shrink-0" type="submit">
                Build My Website Free
                <ArrowRight className="size-4" />
              </button>
            </div>
          </form>

          <div
            className="mono mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2"
            data-gsap-hero-item
          >
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3 text-leaf" />
              14-day free trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3 text-leaf" />
              No credit card
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3 text-leaf" />
              No code
            </span>
          </div>

          <div className="hero-showcase-wrap" data-gsap-hero-showcase>
            <HeroShowcase />
          </div>
        </div>
      </section>

      <ProofStrip />

      <section className="border-y border-rule-2 bg-paper-2 px-5 py-20 sm:px-10 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1fr_88px_1fr]">
          <Card className="p-7">
            <p className="mono mb-5 flex items-center gap-2">
              <span className="size-4 rounded-[3px] bg-[conic-gradient(from_0deg,#4285f4_0_25%,#34a853_25%_50%,#fbbc04_50%_75%,#ea4335_75%)]" />
              Google Business Profile
            </p>
            <div className="flex gap-4">
              <div className="grid size-[74px] shrink-0 place-items-center rounded-card bg-contractor-orange text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
                Logo
              </div>
              <div>
                <h2 className="serif text-2xl font-medium tracking-[-0.02em]">
                  Nova Pro Plumbing
                </h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-accent-ink">
                  <Star className="size-3 fill-accent text-accent" />
                  4.8 <span className="text-ink-3">- 127 Google reviews</span>
                </p>
                <p className="mt-1 text-sm text-ink-3">
                  Plumbing contractor - Alexandria, VA
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 text-sm text-ink-2">
              <p className="flex items-center gap-3">
                <MapPin className="size-4 text-ink-4" />
                218 King Street, Alexandria VA
              </p>
              <p className="flex items-center gap-3">
                <Phone className="size-4 text-ink-4" />
                (703) 555-0182
              </p>
              <p className="flex items-center gap-3">
                <Clock3 className="size-4 text-ink-4" />
                Open - closes 7pm
              </p>
              <p className="flex items-center gap-3 text-accent-ink">
                <Globe2 className="size-4" />
                No website on file
              </p>
            </div>
          </Card>

          <div className="flex flex-col items-center gap-2 text-center">
            <span className="hand text-2xl">90 seconds</span>
            <div className="h-px w-full bg-accent lg:h-24 lg:w-px" />
            <span className="mono text-accent-ink">Onara</span>
          </div>

          <Card className="overflow-hidden">
            <div className="bg-ink px-7 py-8 text-paper">
              <Badge variant="contractor">Generated site</Badge>
              <h3 className="serif mt-5 text-[40px] leading-[0.98] tracking-[-0.04em]">
                Licensed help when the pipe breaks.
              </h3>
              <p className="mt-4 text-sm leading-6 text-paper/70">
                Service area, emergency banner, review badge, estimate CTA, and
                mobile phone action - already laid out.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-paper p-5 text-sm">
              {["Licensed & insured", "Alexandria + NoVA", "Same-day calls", "Free estimates"].map(
                (item) => (
                  <span
                    className="rounded-card border border-rule-2 bg-paper-2 px-3 py-3 text-ink-2"
                    key={item}
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </Card>
        </div>
      </section>

      <section id="how" className="px-5 py-20 sm:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading
              eyebrow="How it works"
              title="Three steps. One coffee."
              body="The landing page promise is simple: no website builder homework, no agency calls, and no blank page."
            />
          </Reveal>

          <Stagger className="mt-14 grid gap-5 lg:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <StaggerItem key={step.title}>
                  <div data-gsap-hover data-gsap-hover-y="-5">
                    <Card className="p-8" interactive>
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="mono text-accent-ink">{step.eyebrow}</p>
                        <span className="hand text-lg">{step.note}</span>
                      </div>
                      <div className="mt-7 grid size-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="serif mt-7 text-[28px] font-medium leading-tight tracking-[-0.03em]">
                        {step.title}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-ink-3">{step.body}</p>
                    </Card>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      <section id="demo" className="border-y border-rule-2 bg-paper-2 px-5 py-20 sm:px-10 lg:py-28">
        <Reveal className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow="60-second demo"
            title="A short walkthrough will live here before launch."
            body="This placeholder reserves the Phase 10 demo slot without pretending the video exists yet. It explains the flow: search, confirm, generate, publish."
          />
          <div
            className="relative overflow-hidden rounded-panel border border-ink bg-ink text-paper shadow-panel"
            data-gsap-hover
            data-gsap-hover-scale="1.01"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,oklch(0.62_0.13_50_/_0.42),transparent_42%)]" />
            <div className="relative grid min-h-[360px] place-items-center p-8 text-center">
              <button
                className="grid size-20 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur"
                data-gsap-pulse
              >
                <Play className="ml-1 size-8 fill-white" />
              </button>
              <div className="mt-8">
                <p className="mono text-paper/60">Coming soon</p>
                <h3 className="serif mt-3 text-[38px] leading-none tracking-[-0.04em]">
                  Watch Onara build a contractor site.
                </h3>
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-paper/64">
                  Final video will show a real Google Business Profile becoming a
                  live contractor website in under two minutes.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="px-5 py-20 sm:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading
              centered
              eyebrow="Contractor-ready features"
              title="Built for calls, trust, and service areas."
              body="A contractor site is different from a restaurant or salon. It needs proof, urgency, location confidence, and a phone number visitors can tap."
            />
          </Reveal>

          <Stagger className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Emergency banner", Zap],
              ["Phone-first CTA", Phone],
              ["License trust strip", ShieldCheck],
              ["Service area SEO", MapPin],
              ["Google reviews badge", Star],
              ["Services list", Wrench],
              ["Free estimate CTA", Hammer],
              ["Mobile-first layout", Globe2],
            ].map(([label, Icon]) => {
              const FeatureIcon = Icon as LucideIcon;

              return (
                <StaggerItem key={label as string}>
                  <div data-gsap-hover data-gsap-hover-x="4">
                    <Card className="flex items-center gap-3 p-4 text-sm font-medium text-ink-2">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink">
                        <FeatureIcon className="size-4" />
                      </span>
                      {label as string}
                    </Card>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      <ContractorStyleGallery />

      <section className="border-y border-rule-2 bg-paper-2 px-5 py-20 sm:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading
              eyebrow="Social proof"
              title="What local business owners say."
              body="Placeholder quotes are visible now so the section is designed. Replace these with approved launch testimonials before public distribution."
            />
          </Reveal>

          <Stagger className="mt-14 grid gap-5 lg:grid-cols-3">
            {testimonials.map((item) => (
              <StaggerItem key={item.quote}>
                <div data-gsap-hover data-gsap-hover-y="-5">
                  <Card className="flex min-h-[280px] flex-col p-7">
                    <div className="flex gap-1 text-accent">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star className="size-4 fill-accent" key={index} />
                      ))}
                    </div>
                    <blockquote className="serif mt-6 text-xl leading-8 tracking-[-0.02em]">
                      &quot;{item.quote}&quot;
                    </blockquote>
                    <div className="mt-auto flex items-center gap-3 border-t border-rule-2 pt-5">
                      <span className="grid size-10 place-items-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent-ink">
                        {item.initials}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-ink-3">{item.role}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="pricing" className="px-5 py-20 sm:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading
              centered
              eyebrow="Pricing"
              title="Simple pricing. No surprises."
              body="Start free for 14 days with no credit card. Upgrade, downgrade, or cancel anytime."
            />
          </Reveal>

          <Stagger className="mt-14 grid gap-5 lg:grid-cols-3">
            {pricing.map((plan) => (
              <StaggerItem key={plan.name}>
                <div
                  data-gsap-hover
                  data-gsap-hover-y={plan.highlighted ? "-8" : "-5"}
                >
                  <Card
                    className={
                      plan.highlighted ? "relative p-7 shadow-panel" : "p-7"
                    }
                    variant={plan.highlighted ? "ink" : "paper"}
                  >
                    {plan.highlighted ? (
                      <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-white">
                        Most popular
                      </span>
                    ) : null}
                    <h3 className="serif text-2xl font-medium tracking-[-0.02em]">
                      {plan.name}
                    </h3>
                    <p
                      className={
                        plan.highlighted
                          ? "mt-2 text-sm text-paper/64"
                          : "mt-2 text-sm text-ink-3"
                      }
                    >
                      {plan.description}
                    </p>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="serif text-[54px] leading-none tracking-[-0.05em]">
                        {plan.price}
                      </span>
                      <span
                        className={
                          plan.highlighted
                            ? "text-sm text-paper/60"
                            : "text-sm text-ink-3"
                        }
                      >
                        {plan.period}
                      </span>
                    </div>
                    <div className="mt-7 grid gap-3">
                      {plan.features.map((feature) => (
                        <p
                          className={
                            plan.highlighted
                              ? "flex gap-3 text-sm text-paper/78"
                              : "flex gap-3 text-sm text-ink-2"
                          }
                          key={feature}
                        >
                          <Check
                            className={
                              plan.highlighted
                                ? "mt-0.5 size-4 shrink-0 text-accent"
                                : "mt-0.5 size-4 shrink-0 text-leaf"
                            }
                          />
                          {feature}
                        </p>
                      ))}
                    </div>
                    <Link
                      href="/auth/signup"
                      className={
                        plan.highlighted
                          ? "btn btn-accent mt-8 w-full"
                          : "btn btn-soft mt-8 w-full"
                      }
                    >
                      {plan.cta}
                    </Link>
                  </Card>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="border-y border-rule-2 bg-paper-2 px-5 py-20 sm:px-10 lg:py-28">
        <div className="mx-auto max-w-[880px]">
          <SectionHeading
            centered
            eyebrow="FAQ"
            title="Honest answers before you try it."
          />

          <div className="mt-12 grid gap-3">
            {faqs.map((faq, index) => (
              <details
                className="group rounded-card border border-rule bg-paper"
                key={faq.q}
                open={index === 0}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 text-left text-base font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="text-ink-4 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-2xl px-6 pb-6 text-sm leading-7 text-ink-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink px-5 py-24 text-center text-paper sm:px-10 lg:py-32">
        <div className="absolute left-1/2 top-1/2 size-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.62_0.13_50_/_0.36),transparent_60%)] blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <p className="mono text-paper/60">Ready in 90 seconds</p>
          <h2 className="serif mt-5 text-[56px] leading-[0.98] tracking-[-0.05em] sm:text-[88px]">
            No designer. No code. No $2,000 website invoice.
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-paper/64">
            Just your contracting business, live on the web, with the details your
            customers need before they call.
          </p>
          <Link href="/auth/signup" className="btn btn-accent btn-lg mt-10">
            Build My Free Website
            <ArrowRight className="size-4" />
          </Link>
          <p className="mono mt-5 text-paper/60">
            No credit card - cancel anytime - setup in 90 seconds
          </p>
        </div>
      </section>

      <footer className="border-t border-rule-2 bg-paper px-5 py-10 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm leading-6 text-ink-3">
              AI websites for local contractors and service businesses.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-ink-3">
            <a href="#pricing">Pricing</a>
            <Link href="/auth/login">Sign in</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href="mailto:support@onara.tech">support@onara.tech</a>
          </div>
        </div>
        <div className="mono mx-auto mt-10 max-w-6xl border-t border-rule-2 pt-6">
          (c) 2026 Onara - AI websites for local businesses
        </div>
      </footer>
    </main>
  );
}
