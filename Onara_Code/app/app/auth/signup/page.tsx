import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Sign up",
};

type SignupPageProps = {
  searchParams: Promise<{
    message?: string;
    next?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { message, next } = await searchParams;
  const nextPath = safeInternalPath(next);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(nextPath);
  }

  return (
    <AuthForm
      initialMessage={message}
      mode="signup"
      nextPath={nextPath}
    />
  );
}

function safeInternalPath(path?: string): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}
