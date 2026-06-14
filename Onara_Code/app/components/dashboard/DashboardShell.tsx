"use client";

import {
  CreditCard,
  Globe2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export type DashboardUser = {
  email: string;
  initial: string;
  isTrial: boolean;
  name: string;
  plan: string;
  trialDaysLeft: number;
};

type DashboardShellProps = {
  children: ReactNode;
  user: DashboardUser;
};

const primaryNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/build", label: "Build New", icon: Plus, accent: true },
];

const secondaryNav = [
  { href: "/account", label: "Account", icon: UserRound },
  { href: "/account/billing", label: "Billing", icon: CreditCard },
  { href: "/help", label: "Help", icon: HelpCircle },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname.startsWith(href);
}

function planLabel(user: DashboardUser) {
  if (user.isTrial) {
    return `${user.plan} trial`;
  }

  return user.plan;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();

    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="dashboard-shell paper">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-logo">
          <Link href="/" className="onara-logo" aria-label="Go to Onara home">
            <span className="onara-logo-mark" aria-hidden="true">
              <span className="onara-logo-dot" />
            </span>
            <span>Onara</span>
          </Link>
        </div>

        <p className="dashboard-sidebar-section-label">Workspace</p>
        <nav className="dashboard-nav" aria-label="Dashboard">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={[
                  "dashboard-nav-link",
                  active ? "dashboard-nav-link-active" : "",
                  item.accent ? "dashboard-nav-link-accent" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <p className="dashboard-sidebar-section-label dashboard-sidebar-section-label-spaced">
          Account
        </p>
        <nav className="dashboard-nav dashboard-nav-secondary" aria-label="Account">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={[
                  "dashboard-nav-link",
                  active ? "dashboard-nav-link-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {user.isTrial ? (
          <div className="dashboard-trial-card">
            <div className="dashboard-trial-icon" aria-hidden="true">
              <Sparkles size={16} />
            </div>
            <p className="mono">Pro trial</p>
            <h2>{user.trialDaysLeft} days left</h2>
            <p>
              Keep your public URL, revisions, and build history after the trial ends.
            </p>
            <Link className="btn btn-accent btn-sm dashboard-trial-button" href="/account/billing">
              Upgrade
            </Link>
          </div>
        ) : null}

        <div className="dashboard-sidebar-footer">
          <div className="dashboard-user-card">
            <span className="dashboard-user-avatar" aria-hidden="true">
              {user.initial}
            </span>
            <span className="dashboard-user-copy">
              <strong>{user.name}</strong>
              <span>{planLabel(user)}</span>
            </span>
          </div>
          <button
            className="dashboard-signout"
            disabled={isPending}
            onClick={signOut}
            type="button"
          >
            <LogOut aria-hidden="true" size={14} />
            {isPending ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-mobile-bar">
          <Link href="/" className="onara-logo" aria-label="Go to Onara home">
            <span className="onara-logo-mark" aria-hidden="true">
              <span className="onara-logo-dot" />
            </span>
            <span>Onara</span>
          </Link>
          <Link className="dashboard-mobile-build" href="/dashboard/build">
            <Globe2 aria-hidden="true" size={14} />
            Build
          </Link>
        </header>
        {children}
      </main>
    </div>
  );
}
