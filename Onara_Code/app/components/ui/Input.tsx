import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

const inputBase =
  "w-full rounded-control border bg-paper px-4 text-sm text-ink outline-none transition placeholder:text-ink-4 focus:border-ink disabled:cursor-not-allowed disabled:bg-paper-2 disabled:text-ink-4";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, ...props },
  ref,
) {
  return (
    <input
      className={cn(
        inputBase,
        "h-12",
        invalid && "border-warn bg-warn-soft focus:border-warn",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid = false, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      className={cn(
        inputBase,
        "min-h-28 resize-y py-3 leading-relaxed",
        invalid && "border-warn bg-warn-soft focus:border-warn",
        className,
      )}
      ref={ref}
      rows={rows}
      {...props}
    />
  );
});
