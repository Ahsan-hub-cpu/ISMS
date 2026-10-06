import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

const controlClass = cn(
  "w-full rounded-lg border border-surface-border-strong bg-surface-raised px-3 text-sm text-content",
  "shadow-[inset_0_1px_2px_oklch(0.35_0.04_220/0.04)] outline-none",
  "transition-[border-color,box-shadow] duration-150",
  "placeholder:text-content-subtle",
  "hover:border-brand-300 dark:hover:border-brand-700",
  "focus:border-brand-500 focus:shadow-[0_0_0_3px_oklch(0.632_0.115_200/0.18)]",
  "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-70",
);

/**
 * Keep text-like inputs controlled for their whole life. Passing `value={undefined}`
 * flips React between uncontrolled and controlled and surfaces a console error.
 * File inputs stay unmanaged (browsers do not allow controlling their value).
 */
export const Input = ({ className, type, value, ...props }: ComponentProps<"input">) => (
  <input
    type={type}
    className={cn(controlClass, type === "file" ? "h-auto" : "h-10", className)}
    {...props}
    {...(type === "file" ? {} : { value: value ?? "" })}
  />
);

export const Select = ({ className, value, ...props }: ComponentProps<"select">) => (
  <select
    className={cn(controlClass, "h-10 cursor-pointer pr-8", className)}
    {...props}
    value={value ?? ""}
  />
);

export const Textarea = ({
  className,
  rows = 4,
  value,
  ...props
}: ComponentProps<"textarea">) => (
  <textarea
    rows={rows}
    className={cn(controlClass, "resize-y py-2.5 leading-relaxed", className)}
    {...props}
    value={value ?? ""}
  />
);

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export const Field = ({ label, htmlFor, hint, error, children }: FieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block text-[0.8125rem] font-semibold text-content">
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
    ) : hint ? (
      <p className="text-xs leading-relaxed text-content-muted">{hint}</p>
    ) : null}
  </div>
);
