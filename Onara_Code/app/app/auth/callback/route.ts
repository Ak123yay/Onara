import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeInternalPath(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

function authRedirect(
  origin: string,
  path: string,
  message?: string,
): NextResponse {
  const redirectUrl = new URL(path, origin);

  if (message) {
    redirectUrl.searchParams.set("message", message);
  }

  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeInternalPath(requestUrl.searchParams.get("next"));
  const providerError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");

  if (providerError) {
    return authRedirect(requestUrl.origin, "/auth/login", providerError);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return authRedirect(
        requestUrl.origin,
        "/auth/login",
        error.message || "Authentication failed. Please try again.",
      );
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  return authRedirect(
    requestUrl.origin,
    "/auth/login",
    "Missing authentication code. Please try signing in again.",
  );
}
