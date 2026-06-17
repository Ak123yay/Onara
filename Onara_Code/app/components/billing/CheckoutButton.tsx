"use client";

import { useState } from "react";

type CheckoutButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  interval?: "month" | "year";
  plan: "starter" | "pro";
};

type CheckoutResponse = {
  message?: string;
  url?: string;
};

export function CheckoutButton({
  children,
  className = "btn btn-accent",
  disabled = false,
  interval = "month",
  plan,
}: CheckoutButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function startCheckout() {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          cancelUrl: "/account/billing?checkout=cancelled",
          interval,
          plan,
          successUrl: "/account/billing?checkout=success",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as CheckoutResponse;

      if (!response.ok || !payload.url) {
        throw new Error(payload.message ?? "Checkout could not be started.");
      }

      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.");
      setIsLoading(false);
    }
  }

  return (
    <span className="checkout-button-wrap">
      <button className={className} disabled={disabled || isLoading} onClick={startCheckout} type="button">
        {isLoading ? "Opening checkout..." : children}
      </button>
      {error ? <span className="checkout-button-error">{error}</span> : null}
    </span>
  );
}
