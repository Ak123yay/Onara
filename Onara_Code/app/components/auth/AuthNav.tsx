"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useAuthUser } from "@/components/auth/useAuthUser";

function userInitial(userName: string | null, email: string | null): string {
  const source = userName || email || "U";
  return source.trim().charAt(0).toUpperCase();
}

function profileLabel(userName: string | null, email: string | null): string {
  if (userName) {
    return userName;
  }

  if (email) {
    return email.split("@")[0];
  }

  return "Account";
}

export function AuthNav() {
  const router = useRouter();
  const { hasLoaded, supabase, user } = useAuthUser();
  const [isPending, startTransition] = useTransition();

  async function signOut() {
    await supabase.auth.signOut();
    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  }

  if (!hasLoaded) {
    return (
      <span className="profile-loading" aria-label="Checking sign-in status">
        <span className="profile-loading-avatar" aria-hidden="true" />
        <span className="profile-loading-line" aria-hidden="true" />
      </span>
    );
  }

  if (user) {
    const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;
    const email = user.email ?? null;
    const displayName = profileLabel(fullName, email);

    return (
      <details className="profile-menu">
        <summary
          className="profile-button"
          aria-label={`Open profile menu for ${displayName}`}
        >
          <span className="profile-avatar" aria-hidden="true">
            {userInitial(fullName, email)}
          </span>
          <span className="profile-email-inline">{displayName}</span>
        </summary>
        <div className="profile-popover">
          <p className="mono profile-popover-label">Signed in as</p>
          <p className="profile-email">{email ?? displayName}</p>
          <Link className="profile-menu-item" href="/dashboard">
            Dashboard
          </Link>
          <Link className="profile-menu-item" href="/auth/update-password">
            Reset password
          </Link>
          <Link className="profile-menu-item" href="mailto:support@onara.tech">
            support@onara.tech
          </Link>
          <button
            className="profile-menu-item profile-menu-button"
            disabled={isPending}
            type="button"
            onClick={signOut}
          >
            {isPending ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </details>
    );
  }

  return (
    <>
      <Link href="/auth/login">Sign in</Link>
      <Link href="/auth/signup" className="btn btn-accent btn-sm">
        Start free
      </Link>
    </>
  );
}
