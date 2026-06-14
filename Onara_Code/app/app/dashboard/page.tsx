import { redirect } from "next/navigation";
import { BusinessSearchFlow } from "@/components/places/BusinessSearchFlow";
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
    <BusinessSearchFlow
      userEmail={user.email ?? ""}
      userName={user.user_metadata?.full_name ?? user.user_metadata?.name ?? null}
    />
  );
}
