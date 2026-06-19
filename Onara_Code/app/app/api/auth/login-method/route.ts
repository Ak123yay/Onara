import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type LoginMethodRequest = {
  email?: unknown;
};

type LoginMethodProfile = {
  auth_provider: string | null;
  auth_providers: string[] | null;
};

type LoginMethodResponse = {
  loginMethod: "email" | "google" | "unknown";
  message?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: LoginMethodRequest;
  try {
    body = (await request.json()) as LoginMethodRequest;
  } catch {
    return NextResponse.json<LoginMethodResponse>(
      { loginMethod: "unknown", message: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json<LoginMethodResponse>(
      { loginMethod: "unknown", message: "Enter a valid email address." },
      { status: 422 },
    );
  }

  const db = createAdminClient();
  const { data: profile, error } = await db
    .from("users")
    .select("auth_provider, auth_providers")
    .eq("email", email)
    .maybeSingle<LoginMethodProfile>();

  if (error) {
    return NextResponse.json<LoginMethodResponse>(
      { loginMethod: "unknown", message: "Could not check account login method." },
      { status: 500 },
    );
  }

  if (!profile) {
    return NextResponse.json<LoginMethodResponse>({ loginMethod: "unknown" });
  }

  const providers = new Set(
    [profile.auth_provider, ...(profile.auth_providers ?? [])]
      .filter((provider): provider is string => typeof provider === "string")
      .map((provider) => provider.toLowerCase()),
  );

  if (providers.has("google") && !providers.has("email")) {
    return NextResponse.json<LoginMethodResponse>({
      loginMethod: "google",
      message: "This account was created with Google. Use Continue with Google to sign in.",
    });
  }

  return NextResponse.json<LoginMethodResponse>({ loginMethod: "email" });
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return email.includes("@") ? email : null;
}
