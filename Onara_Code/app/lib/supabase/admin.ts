import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

function requiredServerEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

export function createAdminClient() {
  const serviceRoleKey = requiredServerEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
  );

  return createClient(env.supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
