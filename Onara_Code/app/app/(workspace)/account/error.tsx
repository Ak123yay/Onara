"use client";

import { RecoverableError } from "@/components/system/RecoverableError";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RecoverableError
      error={error}
      homeHref="/dashboard"
      homeLabel="Open dashboard"
      message="Account or billing details could not load. No plan, payment, or account setting was changed."
      reset={reset}
      title="Account temporarily unavailable"
    />
  );
}
