import Link from "next/link";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { createClient } from "@/lib/supabase/server";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const message = encodeURIComponent("Open the reset password link from your email.");
    redirect(`/auth/login?message=${message}`);
  }

  return (
    <main className="auth-shell">
      <section className="auth-proof">
        <Link href="/" className="onara-logo auth-logo-dark">
          <span className="onara-logo-mark" />
          <span>Onara</span>
        </Link>

        <div className="auth-quote">
          <p className="hand">&quot;The site was ready before my next job call.&quot;</p>
          <h2 className="serif">
            Keep your account secure and get back to your dashboard.
          </h2>
          <div className="auth-customer">
            <div className="auth-thumb" aria-hidden="true">OK</div>
            <div>
              <p>Onara account</p>
              <span>Password recovery</span>
            </div>
          </div>
        </div>

        <p className="mono auth-trust">Secure account recovery</p>
      </section>

      <section className="auth-form-wrap">
        <div className="auth-form-panel">
          <p className="eyebrow">Account security</p>
          <h1 className="serif">
            Reset your
            <br />
            <span className="serif-italic">password</span>.
          </h1>
          <p className="auth-subcopy">
            Choose a new password. You will go back to your dashboard after it saves.
          </p>

          <UpdatePasswordForm />
        </div>
      </section>
    </main>
  );
}
