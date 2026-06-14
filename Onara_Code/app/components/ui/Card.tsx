import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "paper" | "soft" | "accent" | "contractor" | "warning" | "ink";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  interactive?: boolean;
};

const variants: Record<CardVariant, string> = {
  paper: "border-rule bg-paper text-ink",
  soft: "border-rule-2 bg-paper-2 text-ink",
  accent: "border-transparent bg-accent-softer text-accent-ink",
  contractor: "border-contractor-steel/30 bg-contractor-cream text-contractor-navy",
  warning: "border-warn bg-warn-soft text-warn-ink",
  ink: "border-ink bg-ink text-paper",
};

export function Card({ className, variant = "paper", interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border",
        variants[variant],
        interactive && "transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}
