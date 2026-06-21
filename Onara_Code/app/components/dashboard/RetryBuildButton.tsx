"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { fetchWithTimeout } from "@/lib/resilience";

type RetryBuildButtonProps = {
  projectId: string;
};

type RetryResponse = {
  jobId?: string;
  job_id?: string;
  message?: string;
};

export function RetryBuildButton({ projectId }: RetryBuildButtonProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pending = isRetrying || isPending;

  async function retryBuild() {
    if (pending) {
      return;
    }

    setIsRetrying(true);
    try {
      const response = await fetchWithTimeout(
        `/api/projects/${encodeURIComponent(projectId)}/retry`,
        { method: "POST" },
        20_000,
      );
      const payload = (await response.json().catch(() => ({}))) as RetryResponse;

      if (!response.ok) {
        window.alert(payload.message ?? "Build retry could not start.");
        return;
      }

      const jobId = payload.jobId ?? payload.job_id;
      if (jobId) {
        router.push(
          `/dashboard/build/progress?jobId=${encodeURIComponent(jobId)}&projectId=${encodeURIComponent(projectId)}`,
        );
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      window.alert("Build retry could not reach Onara. Your existing project was not changed.");
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <button className="btn btn-accent btn-sm" disabled={pending} onClick={retryBuild} type="button">
      <RefreshCw aria-hidden="true" size={14} />
      {pending ? "Retrying" : "Retry"}
    </button>
  );
}
