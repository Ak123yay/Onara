"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DeleteSiteButtonProps = {
  businessName: string;
  disabled?: boolean;
  disabledReason?: string;
  projectId: string;
};

type DeleteSiteResponse = {
  message?: string;
};

export function DeleteSiteButton({
  businessName,
  disabled = false,
  disabledReason,
  projectId,
}: DeleteSiteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pending = isDeleting || isPending;
  const buttonDisabled = pending || disabled;

  async function deleteSite() {
    if (buttonDisabled) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${businessName}? This removes it from your dashboard and frees the site slot.`,
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as DeleteSiteResponse;

      if (!response.ok) {
        window.alert(payload.message ?? "Site could not be deleted.");
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      aria-label={`Delete ${businessName}`}
      className="btn btn-danger btn-sm"
      disabled={buttonDisabled}
      onClick={deleteSite}
      title={disabled ? disabledReason : `Delete ${businessName}`}
      type="button"
    >
      <Trash2 aria-hidden="true" size={14} />
      {pending ? "Deleting" : "Delete"}
    </button>
  );
}
