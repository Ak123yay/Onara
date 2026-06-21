"use client";

import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type RecoverableErrorProps = {
  error?: Error & { digest?: string };
  homeHref?: string;
  homeLabel?: string;
  message?: string;
  reset?: () => void;
  title?: string;
};

export function RecoverableError({
  error,
  homeHref = "/",
  homeLabel = "Back to Onara",
  message = "This part of Onara could not load. Your saved work was not changed.",
  reset,
  title = "Something needs attention",
}: RecoverableErrorProps) {
  useEffect(() => {
    if (error) {
      console.error("Recoverable Onara error", error);
    }
  }, [error]);

  return (
    <main className="recoverable-error-shell">
      <section className="recoverable-error-card card">
        <p className="eyebrow">Onara recovery</p>
        <h1 className="serif">{title}</h1>
        <p>{message}</p>
        <div className="recoverable-error-actions">
          {reset ? (
            <button className="btn btn-accent" type="button" onClick={reset}>
              <RefreshCw aria-hidden="true" size={15} />
              Try again
            </button>
          ) : null}
          <Link className="btn btn-soft" href={homeHref}>
            <ArrowLeft aria-hidden="true" size={15} />
            {homeLabel}
          </Link>
        </div>
        <small>
          If this keeps happening, contact{" "}
          <a href="mailto:support@onara.tech">support@onara.tech</a>.
        </small>
      </section>
    </main>
  );
}
