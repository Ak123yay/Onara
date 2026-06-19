"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type CancelSubscriptionResponse = {
  message?: string;
  ok?: boolean;
  warning?: string;
};

export function CancelSubscriptionButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function cancelSubscription() {
    const confirmed = window.confirm(
      "Cancel your Onara subscription now? Paid features and public URL visibility will be turned off.",
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/cancel-subscription", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as CancelSubscriptionResponse;

      if (!response.ok || payload.ok === false) {
        throw new Error(payload.message ?? "Subscription could not be canceled.");
      }

      setMessage(payload.warning ?? payload.message ?? "Subscription canceled.");
      startTransition(() => {
        router.refresh();
      });
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Subscription could not be canceled.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="account-billing-cancel">
      <button
        className="btn btn-soft account-billing-cancel-button"
        disabled={isLoading || isPending}
        onClick={cancelSubscription}
        type="button"
      >
        {isLoading || isPending ? "Canceling..." : "Cancel subscription"}
      </button>
      <p className="account-billing-cancel-note">
        Cancels through Stripe and turns off paid public URL access.
      </p>
      {message ? <p className="account-billing-cancel-message">{message}</p> : null}
      {error ? <p className="account-billing-cancel-error">{error}</p> : null}
    </div>
  );
}
