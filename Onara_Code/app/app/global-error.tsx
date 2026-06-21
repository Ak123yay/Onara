"use client";

import { RecoverableError } from "@/components/system/RecoverableError";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <RecoverableError
          error={error}
          message="Onara could not finish loading. Try again without losing your saved account or project data."
          reset={reset}
          title="Onara could not load"
        />
      </body>
    </html>
  );
}
