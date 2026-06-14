import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "manual" | "contractor";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-paper-2 text-ink-3",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-leaf-soft text-leaf",
  warning: "bg-warn-soft text-warn-ink",
  manual: "bg-accent-soft text-accent-ink",
  contractor: "bg-contractor-orange/15 text-contractor-orange-dark",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-badge px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
