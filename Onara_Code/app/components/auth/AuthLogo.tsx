"use client";

import Link from "next/link";
import { useAuthUser } from "@/components/auth/useAuthUser";

export function AuthLogo() {
  const { hasLoaded, user } = useAuthUser();
  const href = hasLoaded && user ? "/dashboard" : "/";

  return (
    <Link
      href={href}
      className="onara-logo"
      aria-label={user ? "Open Onara dashboard" : "Onara home"}
    >
      <span className="onara-logo-mark" aria-hidden="true">
        <span className="onara-logo-dot" />
      </span>
      <span>Onara</span>
    </Link>
  );
}
