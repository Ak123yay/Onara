import { jsonResponse, requireBearerSecret, requireMethod } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  const methodError = requireMethod(request, "POST");
  if (methodError) return methodError;

  const cronSecret = Deno.env.get("CRON_SECRET") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authError = requireBearerSecret(request, cronSecret);
  if (authError) return authError;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("users")
    .update({
      plan: "free",
      is_trial: false,
      show_url: false,
      revisions_limit: 3,
      revisions_used: 0,
    })
    .eq("is_trial", true)
    .lt("trial_ends_at", new Date().toISOString())
    .select("id");

  if (error) {
    return jsonResponse({ error: "downgrade_failed", detail: error.message }, 500);
  }

  return jsonResponse({ ok: true, users_downgraded: data?.length ?? 0 });
});
