"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
  nextPath?: string;
};

export function AuthForm({ mode, nextPath = "/dashboard" }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function continueWithGoogle() {
    setMessage(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
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
    }
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Check your email to finish creating your account.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }

    startTransition(() => {
      router.push(nextPath);
      router.refresh();
    });
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

          <button className="btn btn-soft auth-google" type="button" onClick={continueWithGoogle}>
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="auth-divider">
            <span />
            <p className="mono">or</p>
            <span />
          </div>

          <form onSubmit={submitEmail}>
            <label className="mono" htmlFor="email">Email</label>
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

            <label className="mono auth-password-label" htmlFor="password">Password</label>
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

            <button className="btn btn-accent auth-submit" type="submit" disabled={isPending}>
              {isSignup ? "Create account" : "Sign in"}
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
