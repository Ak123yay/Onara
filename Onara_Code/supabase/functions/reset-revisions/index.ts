import { jsonResponse, requireBearerSecret, requireMethod } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  const methodError = requireMethod(request, "POST");
  if (methodError) return methodError;

  const cronSecret = Deno.env.get("CRON_SECRET") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authError = requireBearerSecret(request, cronSecret);
  if (authError) return authError;

  const supabase = createServiceClient();
  const nextResetAt = new Date();
  nextResetAt.setUTCMonth(nextResetAt.getUTCMonth() + 1, 1);
  nextResetAt.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("users")
    .update({
      revisions_used: 0,
      revisions_reset_at: nextResetAt.toISOString(),
    })
    .eq("plan", "free")
    .select("id");

  if (error) {
    return jsonResponse({ error: "reset_failed", detail: error.message }, 500);
  }

  return jsonResponse({ ok: true, users_updated: data?.length ?? 0 });
});
