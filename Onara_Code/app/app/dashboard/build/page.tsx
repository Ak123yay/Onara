import { redirect } from "next/navigation";
import { BusinessSearchFlow } from "@/components/places/BusinessSearchFlow";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type BuildProfile = {
  full_name: string | null;
  is_trial: boolean | null;
  plan: string | null;
};

type BuildPlan = "free" | "starter" | "pro";

type DashboardBuildPageProps = {
  searchParams?: Promise<{
    query?: string | string[];
  }>;
};

export default async function DashboardBuildPage({ searchParams }: DashboardBuildPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/build");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const queryParam = resolvedSearchParams.query;
  const initialQuery = Array.isArray(queryParam) ? queryParam[0] : queryParam;
  const db = createAdminClient();
  const { data: profile } = await db
    .from("users")
    .select("full_name, plan, is_trial")
    .eq("id", user.id)
    .maybeSingle<BuildProfile>();
  const userPlan = planForBuild(profile);

  return (
    <BusinessSearchFlow
      initialQuery={initialQuery}
      isTrial={Boolean(profile?.is_trial)}
      userEmail={user.email ?? ""}
      userName={profile?.full_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? null}
      userPlan={userPlan}
    />
  );
}

function planForBuild(profile: BuildProfile | null): BuildPlan {
  if (profile?.is_trial) {
    return "pro";
  }

  if (profile?.plan === "starter" || profile?.plan === "pro") {
    return profile.plan;
  }

  return "free";
}
