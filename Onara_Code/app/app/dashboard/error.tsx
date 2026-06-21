"use client";

import { RecoverableError } from "@/components/system/RecoverableError";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RecoverableError
      error={error}
      homeHref="/"
      message="Your dashboard data is temporarily unavailable. Existing sites and account data were not changed."
      reset={reset}
      title="Dashboard unavailable"
    />
  );
}
