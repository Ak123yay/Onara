"use client";

import {
  CheckoutElementsProvider,
  ExpressCheckoutElement,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe, StripeCheckoutElementsSdkOptions } from "@stripe/stripe-js";
import { ArrowLeft, LockKeyhole, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Component, type ComponentProps, type ErrorInfo, type ReactNode, useEffect, useState } from "react";
import { fetchWithTimeout } from "@/lib/resilience";

type BillingPlan = "starter" | "pro";
type BillingInterval = "month" | "year";

type EmbeddedCheckoutFormProps = {
  interval: BillingInterval;
  plan: BillingPlan;
  publishableKey: string;
};

type CheckoutSessionResponse = {
  client_secret?: string;
  clientSecret?: string;
  message?: string;
};

type ExpressCheckoutConfirmEvent = Parameters<
  NonNullable<ComponentProps<typeof ExpressCheckoutElement>["onConfirm"]>
>[0];
type ExpressCheckoutReadyEvent = Parameters<
  NonNullable<ComponentProps<typeof ExpressCheckoutElement>["onReady"]>
>[0];
type CheckoutProviderState = {
  key: string;
  options: StripeCheckoutElementsSdkOptions;
};
type CheckoutLoadState = {
  error: string | null;
  provider: CheckoutProviderState | null;
};
type CheckoutErrorBoundaryProps = {
  children: ReactNode;
};
type CheckoutErrorBoundaryState = {
  message: string | null;
};

const clientSecretCache = new Map<string, Promise<string>>();
let stripePromise: Promise<Stripe | null> | null = null;

const expressCheckoutOptions: NonNullable<ComponentProps<typeof ExpressCheckoutElement>["options"]> = {
  buttonHeight: 48,
  buttonTheme: {
    applePay: "black",
    googlePay: "black",
  },
  buttonType: {
    applePay: "subscribe",
    googlePay: "subscribe",
  },
  layout: {
    maxColumns: 1,
    maxRows: 2,
    overflow: "auto",
  },
  paymentMethodOrder: ["applePay", "googlePay", "link"],
  paymentMethods: {
    amazonPay: "never",
    applePay: "auto",
    googlePay: "auto",
    klarna: "never",
    link: "auto",
    paypal: "never",
  },
};

class CheckoutErrorBoundary extends Component<CheckoutErrorBoundaryProps, CheckoutErrorBoundaryState> {
  state: CheckoutErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): CheckoutErrorBoundaryState {
    return {
      message: error instanceof Error ? error.message : "Checkout could not be loaded.",
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error("Embedded checkout crashed", error, errorInfo);
  }

  render() {
    if (this.state.message) {
      return <CheckoutLoadError message={this.state.message} />;
    }

    return this.props.children;
  }
}

export function EmbeddedCheckoutForm({ interval, plan, publishableKey }: EmbeddedCheckoutFormProps) {
  const stripe = getStripePromise(publishableKey);
  const [checkoutLoad, setCheckoutLoad] = useState<CheckoutLoadState>({
    error: null,
    provider: null,
  });
  const checkoutKey = `${plan}:${interval}`;

  useEffect(() => {
    let isCancelled = false;

    setCheckoutLoad({ error: null, provider: null });

    checkoutClientSecret(plan, interval)
      .then((clientSecret) => {
        if (isCancelled) {
          return;
        }

        setCheckoutLoad({
          error: null,
          provider: {
            key: checkoutKey,
            options: {
              clientSecret,
              elementsOptions: {
                appearance: {
                  variables: {
                    borderRadius: "2px",
                    colorBackground: "#fbfaf6",
                    colorDanger: "#b94a34",
                    colorPrimary: "#bd632f",
                    colorText: "#1a1a1a",
                    colorTextSecondary: "#6a6a6a",
                    fontFamily: "Inter, sans-serif",
                    spacingGridRow: "14px",
                  },
                },
                loader: "auto",
              },
            },
          },
        });
      })
      .catch((checkoutError) => {
        if (isCancelled) {
          return;
        }

        setCheckoutLoad({
          error: checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.",
          provider: null,
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [checkoutKey, interval, plan]);

  if (checkoutLoad.error) {
    return <CheckoutLoadError message={checkoutLoad.error} />;
  }

  if (!checkoutLoad.provider || checkoutLoad.provider.key !== checkoutKey) {
    return (
      <div className="embedded-checkout-state card">
        <p className="eyebrow">Stripe checkout</p>
        <h2 className="serif">Loading secure payment form</h2>
        <p>Preparing the Checkout Session for {planLabel(plan, interval)}.</p>
      </div>
    );
  }

  return (
    <CheckoutErrorBoundary>
      <CheckoutElementsProvider key={checkoutLoad.provider.key} options={checkoutLoad.provider.options} stripe={stripe}>
        <CheckoutPaymentForm interval={interval} plan={plan} />
      </CheckoutElementsProvider>
    </CheckoutErrorBoundary>
  );
}

function CheckoutLoadError({ message }: { message: string }) {
  const safeMessage = checkoutPublicMessage(message);
  return (
    <div className="embedded-checkout-state embedded-checkout-state-error card">
      <p className="eyebrow">Checkout unavailable</p>
      <h2 className="serif">Could not load Stripe</h2>
      <p>{safeMessage}</p>
      <div className="embedded-checkout-actions">
        <button className="btn btn-accent" type="button" onClick={() => window.location.reload()}>
          <RefreshCw aria-hidden="true" size={14} />
          Try again
        </button>
        <Link className="btn btn-soft" href="/account/billing">
          <ArrowLeft aria-hidden="true" size={14} />
          Back to billing
        </Link>
      </div>
    </div>
  );
}

function checkoutPublicMessage(message: string) {
  const normalized = message.toLowerCase();
  if (
    message.length > 300
    || normalized.includes("abort")
    || normalized.includes("client_secret")
    || normalized.includes("stack")
    || normalized.includes("stripe.js")
  ) {
    return "Secure checkout could not load. No payment or plan change was made. Try again shortly.";
  }
  return message;
}

function CheckoutPaymentForm({ interval, plan }: Pick<EmbeddedCheckoutFormProps, "interval" | "plan">) {
  const checkoutState = useCheckoutElements();
  const [error, setError] = useState<string | null>(null);
  const [hasExpressPaymentMethods, setHasExpressPaymentMethods] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (checkoutState.type === "loading") {
    return (
      <div className="embedded-checkout-state card">
        <p className="eyebrow">Stripe checkout</p>
        <h2 className="serif">Loading secure payment form</h2>
        <p>Preparing the Checkout Session for {planLabel(plan, interval)}.</p>
      </div>
    );
  }

  if (checkoutState.type === "error") {
    return <CheckoutLoadError message={checkoutState.error.message} />;
  }

  const { checkout } = checkoutState;
  const primaryLineItem = checkout.lineItems[0];
  const totalAmount = checkout.total.total.amount;
  const isReady = checkout.canConfirm && !isSubmitting;

  function checkoutReturnUrl() {
    const returnUrl = new URL("/account/billing", window.location.origin);
    returnUrl.searchParams.set("checkout", "success");
    returnUrl.searchParams.set("session_id", checkout.id);
    return returnUrl;
  }

  function updateExpressPaymentMethods(event: ExpressCheckoutReadyEvent) {
    const paymentMethods = event.availablePaymentMethods;
    setHasExpressPaymentMethods(
      Boolean(paymentMethods && Object.values(paymentMethods).some(Boolean)),
    );
  }

  async function confirmExpressCheckout(event: ExpressCheckoutConfirmEvent) {
    setError(null);
    setIsSubmitting(true);

    const returnUrl = checkoutReturnUrl();
    const result = await checkout.confirm({
      expressCheckoutConfirmEvent: event,
      redirect: "if_required",
      returnUrl: returnUrl.toString(),
    });

    if (result.type === "error") {
      event.paymentFailed({ message: result.error.message, reason: "fail" });
      setError(result.error.message);
      setIsSubmitting(false);
      return;
    }

    window.location.assign(returnUrl.toString());
  }

  async function submitCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const returnUrl = checkoutReturnUrl();
    const result = await checkout.confirm({
      redirect: "if_required",
      returnUrl: returnUrl.toString(),
    });

    if (result.type === "error") {
      setError(result.error.message);
      setIsSubmitting(false);
      return;
    }

    window.location.assign(returnUrl.toString());
  }

  return (
    <form className="embedded-checkout-form card" onSubmit={submitCheckout}>
      <div className="embedded-checkout-form-header">
        <div>
          <p className="eyebrow">Secure checkout</p>
          <h2 className="serif">Payment details</h2>
        </div>
        <span className="embedded-checkout-lock">
          <LockKeyhole aria-hidden="true" size={14} />
          Stripe
        </span>
      </div>

      <div className="embedded-checkout-total">
        <div>
          <span>{primaryLineItem?.name ?? planLabel(plan, interval)}</span>
          <strong>{totalAmount}</strong>
        </div>
        <p>
          Billed {interval === "year" ? "annually" : "monthly"}. Your account updates after Stripe sends the
          subscription webhook.
        </p>
      </div>

      <div
        className={[
          "embedded-wallet-checkout",
          hasExpressPaymentMethods ? "embedded-wallet-checkout-visible" : "embedded-wallet-checkout-hidden",
        ].join(" ")}
      >
        <p className="eyebrow">Express checkout</p>
        <ExpressCheckoutElement
          onConfirm={(event) => {
            void confirmExpressCheckout(event);
          }}
          onReady={updateExpressPaymentMethods}
          options={expressCheckoutOptions}
        />
        <div className="embedded-wallet-divider">
          <span>or continue below</span>
        </div>
      </div>

      <PaymentElement options={{ layout: "accordion" }} />

      {error ? <p className="embedded-checkout-error">{error}</p> : null}

      <div className="embedded-checkout-actions">
        <Link className="btn btn-soft" href="/account/billing">
          <ArrowLeft aria-hidden="true" size={14} />
          Back
        </Link>
        <button className="btn btn-accent" disabled={!isReady} type="submit">
          {isSubmitting ? "Confirming..." : `Pay ${totalAmount}`}
        </button>
      </div>
    </form>
  );
}

function checkoutClientSecret(plan: BillingPlan, interval: BillingInterval) {
  const cacheKey = `${window.location.origin}:${plan}:${interval}`;
  const cached = clientSecretCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const returnUrl = new URL("/account/billing", window.location.origin);
  returnUrl.searchParams.set("checkout", "success");

  const clientSecret = fetchWithTimeout(
    "/api/billing/create-elements-checkout-session",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        interval,
        plan,
        returnUrl: returnUrl.toString(),
      }),
    },
    20_000,
  )
    .then(async (response) => {
      const payload = (await response.json().catch(() => ({}))) as CheckoutSessionResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "Checkout could not be started.");
      }

      const secret = payload.client_secret ?? payload.clientSecret;
      if (!secret) {
        throw new Error("Stripe did not return a checkout client secret.");
      }

      return secret;
    })
    .catch((checkoutError) => {
      clientSecretCache.delete(cacheKey);
      throw checkoutError;
    });

  clientSecretCache.set(cacheKey, clientSecret);
  return clientSecret;
}

function getStripePromise(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey, {
      developerTools: {
        assistant: {
          enabled: false,
        },
      },
    });
  }

  return stripePromise;
}

function planLabel(plan: BillingPlan, interval: BillingInterval) {
  const planName = plan === "pro" ? "Pro" : "Starter";
  return interval === "year" ? `${planName} annual` : `${planName} monthly`;
}
