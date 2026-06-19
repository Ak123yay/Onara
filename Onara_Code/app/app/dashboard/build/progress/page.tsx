import { Suspense } from "react";
import type { Metadata } from "next";
import { AgentProgressExperience } from "@/components/build/AgentProgressExperience";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Build progress",
};

export default function BuildProgressPage() {
  return (
    <Suspense fallback={<div className="agent-progress-shell">Loading progress...</div>}>
      <AgentProgressExperience />
    </Suspense>
  );
}
