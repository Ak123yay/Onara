import { redirect } from "next/navigation";
import { DashboardShell, type DashboardUser } from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/server";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

function daysUntil(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const delta = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(delta / 86_400_000));
}

function initialFor(name: string, email: string) {
  return (name || email || "U").trim().charAt(0).toUpperCase();
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, plan, is_trial, trial_ends_at")
    .eq("id", user.id)
    .maybeSingle();

  const email = user.email ?? "";
  const name =
    profile?.full_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    email.split("@")[0] ??
    "Account";

  const dashboardUser: DashboardUser = {
    email,
    initial: initialFor(name, email),
    isTrial: profile?.is_trial ?? true,
    name,
    plan: profile?.plan ?? "free",
    trialDaysLeft: daysUntil(profile?.trial_ends_at),
  };

  return <DashboardShell user={dashboardUser}>{children}</DashboardShell>;
}
