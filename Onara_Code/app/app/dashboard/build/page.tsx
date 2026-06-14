import { redirect } from "next/navigation";
import { BusinessSearchFlow } from "@/components/places/BusinessSearchFlow";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <BusinessSearchFlow
      initialQuery={initialQuery}
      userEmail={user.email ?? ""}
      userName={user.user_metadata?.full_name ?? user.user_metadata?.name ?? null}
    />
  );
}
