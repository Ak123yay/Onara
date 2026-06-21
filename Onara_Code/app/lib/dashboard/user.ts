import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { DashboardUser } from "@/components/dashboard/DashboardShell";

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

export async function getDashboardUserOrRedirect(nextPath: string): Promise<DashboardUser> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error("Account session service is temporarily unavailable.");
  }

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }

  const db = createAdminClient();
  const { data: profile } = await db
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

  return {
    email,
    initial: initialFor(name, email),
    isTrial: profile?.is_trial ?? true,
    name,
    plan: profile?.plan ?? "free",
    trialDaysLeft: daysUntil(profile?.trial_ends_at),
    trialEndsAt: profile?.trial_ends_at ?? null,
  };
}
