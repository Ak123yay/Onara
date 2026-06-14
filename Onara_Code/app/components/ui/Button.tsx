import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "ink" | "accent" | "soft" | "ghost" | "contractor" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  ink: "border-ink bg-ink text-paper hover:bg-ink-2",
  accent: "border-accent bg-accent text-white hover:border-accent-2 hover:bg-accent-2",
  soft: "border-rule bg-paper-2 text-ink hover:bg-paper-3",
  ghost: "border-transparent bg-transparent text-ink hover:border-rule hover:bg-paper-2",
  contractor:
    "border-contractor-orange bg-contractor-orange text-white hover:border-contractor-orange-dark hover:bg-contractor-orange-dark",
  danger: "border-danger bg-danger text-white hover:border-danger-dark hover:bg-danger-dark",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-3 text-[13.5px]",
  lg: "px-6 py-4 text-[14.5px]",
  icon: "size-10 p-0",
};

export function Button({
  className,
  variant = "ink",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control border font-medium tracking-[-0.005em] transition duration-150 ease-out hover:-translate-y-px disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
