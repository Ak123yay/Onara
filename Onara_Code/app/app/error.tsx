"use client";

import { RecoverableError } from "@/components/system/RecoverableError";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RecoverableError error={error} reset={reset} />;
}
