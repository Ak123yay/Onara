import { Suspense } from "react";
import { AgentProgressExperience } from "@/components/build/AgentProgressExperience";

export default function BuildProgressPage() {
  return (
    <Suspense fallback={<div className="agent-progress-shell">Loading progress...</div>}>
      <AgentProgressExperience />
    </Suspense>
  );
}
