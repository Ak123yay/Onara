import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  return (
    <main className="dashboard-check paper">
      <section>
        <Link href="/" className="onara-logo">
          <span className="onara-logo-mark" />
          <span>Onara</span>
        </Link>
        <p className="eyebrow">Authenticated workspace</p>
        <h1 className="serif">You are signed in.</h1>
        <p>
          This placeholder confirms Supabase Auth, session cookies, and route protection are
          wired before the full dashboard shell is built.
        </p>
        <div className="dashboard-user">
          <span className="mono">Current user</span>
          <strong>{user.email}</strong>
        </div>
      </section>
    </main>
  );
}
