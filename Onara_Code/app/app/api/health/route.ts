import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const services = {
    googlePlaces: configured("GOOGLE_PLACES_API_KEY"),
    pipeline: configured("PIPELINE_SERVER_URL") && configured("PIPELINE_API_SECRET"),
    stripe: configured("STRIPE_SECRET_KEY") && configured("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
    supabase: configured("NEXT_PUBLIC_SUPABASE_URL") && configured("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
  const ready = services.supabase;
  const degraded = Object.values(services).some((value) => !value);

  return NextResponse.json(
    {
      degraded,
      ready,
      services,
      status: ready ? (degraded ? "degraded" : "ok") : "unavailable",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status: ready ? 200 : 503,
    },
  );
}

function configured(name: string) {
  return Boolean(process.env[name]?.trim());
}
