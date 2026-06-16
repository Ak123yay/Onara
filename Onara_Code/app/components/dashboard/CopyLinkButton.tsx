"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

type CopyLinkButtonProps = {
  className?: string;
  label?: string;
  value: string;
};

export function CopyLinkButton({ className = "", label = "Copy link", value }: CopyLinkButtonProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const copied = copyState === "copied";

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopyState("idle");
    }, 1300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copyState]);

  async function copyLink() {
    setCopyState("copied");

    if (copyWithTextarea(value)) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
      }
    } catch {
      // Fall through to the failed state below.
    }

    setCopyState("failed");
  }

  return (
    <button
      aria-live="polite"
      className={`btn btn-soft btn-sm site-copy-button ${className}`.trim()}
      onClick={() => {
        void copyLink();
      }}
      type="button"
    >
      {copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
      {copyState === "failed" ? "Copy failed" : copied ? "Copied" : label}
    </button>
  );
}

function copyWithTextarea(value: string) {
  const selection = document.getSelection();
  const selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const textarea = document.createElement("textarea");

  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.width = "1px";
  textarea.style.height = "1px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
    activeElement?.focus({ preventScroll: true });

    if (selectedRange && selection) {
      selection.removeAllRanges();
      selection.addRange(selectedRange);
    }
  }
}
