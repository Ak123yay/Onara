"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isAuthPending, setIsAuthPending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isBusy = isAuthPending || isPending;

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage("Use at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsAuthPending(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setIsAuthPending(false);
      return;
    }

    startTransition(() => {
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={updatePassword}>
      <label className="mono" htmlFor="password">New password</label>
      <PasswordInput
        id="password"
        autoComplete="new-password"
        placeholder="Minimum 6 characters"
        value={password}
        onChange={setPassword}
        required
        minLength={6}
      />

      <label className="mono auth-password-label" htmlFor="confirmPassword">Confirm password</label>
      <PasswordInput
        id="confirmPassword"
        autoComplete="new-password"
        placeholder="Repeat your new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        required
        minLength={6}
      />

      {message ? <p className="auth-message">{message}</p> : null}

      <button className="btn btn-accent auth-submit" type="submit" disabled={isBusy}>
        {isBusy ? "Saving password..." : "Save new password"}
        <ArrowRight size={14} aria-hidden="true" />
      </button>
    </form>
  );
}
