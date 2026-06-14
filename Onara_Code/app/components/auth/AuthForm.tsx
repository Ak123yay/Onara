"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
  initialMessage?: string | null;
  nextPath?: string;
};

type AuthAction = "email" | "google" | "reset";

function safeInternalPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

export function AuthForm({
  initialMessage = null,
  mode,
  nextPath = "/dashboard",
}: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isSignup = mode === "signup";
  const safeNextPath = safeInternalPath(nextPath);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [pendingAuthAction, setPendingAuthAction] = useState<AuthAction | null>(null);
  const [isPending, startTransition] = useTransition();
  const isAuthPending = pendingAuthAction !== null;
  const isBusy = isAuthPending || isPending;

  async function continueWithGoogle() {
    setMessage(null);
    setPendingAuthAction("google");
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setPendingAuthAction(null);
      }
    } catch {
      setMessage("Google sign-in could not start. Please try again.");
      setPendingAuthAction(null);
    }
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setPendingAuthAction("email");

    if (isSignup) {
      const trimmedName = fullName.trim();

      if (!trimmedName) {
        setMessage("Enter your name to create your account.");
        setPendingAuthAction(null);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: trimmedName,
            name: trimmedName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath)}`,
        },
      });

      if (error) {
        setMessage(error.message);
        setPendingAuthAction(null);
        return;
      }

      if (data.session) {
        startTransition(() => {
          router.push(safeNextPath);
          router.refresh();
        });
        return;
      }

      setMessage("Check your email to finish creating your account.");
      setPendingAuthAction(null);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setPendingAuthAction(null);
      return;
    }

    startTransition(() => {
      router.push(safeNextPath);
      router.refresh();
    });
  }

  async function sendPasswordReset() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setMessage("Enter your email first, then click reset password.");
      return;
    }

    setMessage(null);
    setPendingAuthAction("reset");

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`,
    });

    if (error) {
      setMessage(error.message);
      setPendingAuthAction(null);
      return;
    }

    setMessage("Check your email for a password reset link.");
    setPendingAuthAction(null);
  }

  return (
    <main className="auth-shell">
      <section className="auth-proof">
        <Link href="/" className="onara-logo auth-logo-dark">
          <span className="onara-logo-mark" />
          <span>Onara</span>
        </Link>

        <div className="auth-quote">
          <p className="hand">&quot;90 seconds. I almost cried.&quot;</p>
          <h2 className="serif">
            I&apos;d been putting off a website for <span className="serif-italic">six years</span>.
            Onara built mine while my kettle boiled.
          </h2>
          <div className="auth-customer">
            <div className="auth-thumb" aria-hidden="true">BF</div>
            <div>
              <p>Rosa Mendez</p>
              <span>Bloom Florist · Brooklyn</span>
            </div>
          </div>
        </div>

        <p className="mono auth-trust">Trusted by local service businesses</p>
      </section>

      <section className="auth-form-wrap">
        <div className="auth-form-panel">
          <p className="eyebrow">{isSignup ? "Create account" : "Welcome back"}</p>
          <h1 className="serif">
            {isSignup ? (
              <>
                Build your first
                <br />
                site in <span className="serif-italic">90s</span>.
              </>
            ) : (
              <>
                Sign in to <span className="serif-italic">Onara</span>.
              </>
            )}
          </h1>
          <p className="auth-subcopy">
            {isSignup ? "14-day Pro trial. No credit card." : "Pick up where you left off."}
          </p>

          <button
            className="btn btn-soft auth-google"
            disabled={isBusy}
            type="button"
            onClick={continueWithGoogle}
          >
            <GoogleIcon />
            {pendingAuthAction === "google" ? "Opening Google..." : "Continue with Google"}
          </button>

          <div className="auth-divider">
            <span />
            <p className="mono">or</p>
            <span />
          </div>

          <form onSubmit={submitEmail}>
            {isSignup ? (
              <>
                <label className="mono" htmlFor="fullName">Your name</label>
                <input
                  className="input"
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Aarush Katam"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </>
            ) : null}

            <label className={isSignup ? "mono auth-password-label" : "mono"} htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@business.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <div className="auth-label-row auth-password-label">
              <label className="mono" htmlFor="password">Password</label>
              {!isSignup ? (
                <button
                  className="auth-link-button"
                  disabled={isBusy}
                  type="button"
                  onClick={sendPasswordReset}
                >
                  {pendingAuthAction === "reset" ? "Sending reset link..." : "Reset password"}
                </button>
              ) : null}
            </div>
            <input
              className="input"
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />

            {message ? <p className="auth-message">{message}</p> : null}

            <button className="btn btn-accent auth-submit" type="submit" disabled={isBusy}>
              {pendingAuthAction === "email"
                ? isSignup
                  ? "Creating account..."
                  : "Signing in..."
                : isSignup
                  ? "Create account"
                  : "Sign in"}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? "Already have an account?" : "New to Onara?"}{" "}
            <Link href={isSignup ? "/auth/login" : "/auth/signup"}>
              {isSignup ? "Sign in" : "Create account"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9c-.3 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.3z" />
      <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.2-1.9-6-4.4H2.3v2.8C4.2 20.7 7.9 23 12 23z" />
      <path fill="#FBBC04" d="M6 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.9H2.3C1.5 8.5 1 10.2 1 12s.5 3.5 1.3 5.1L6 14.3z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.9 1 4.2 3.3 2.3 6.9L6 9.7c.9-2.6 3.3-4.3 6-4.3z" />
    </svg>
  );
}
