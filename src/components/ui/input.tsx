import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

const controlClass =
  "h-10 w-full rounded-lg border bg-surface-raised px-3 text-sm text-content outline-none transition-colors placeholder:text-content-muted/70 focus:border-brand-500 disabled:opacity-60";

export const Input = ({ className, ...props }: ComponentProps<"input">) => (
  <input className={cn(controlClass, className)} {...props} />
);

export const Select = ({ className, ...props }: ComponentProps<"select">) => (
  <select className={cn(controlClass, "pr-8", className)} {...props} />
);

export const Textarea = ({ className, rows = 4, ...props }: ComponentProps<"textarea">) => (
  <textarea
    rows={rows}
    className={cn(controlClass, "h-auto resize-y py-2 leading-relaxed", className)}
    {...props}
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
    <label htmlFor={htmlFor} className="block text-sm font-medium">
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
    ) : hint ? (
      <p className="text-xs text-content-muted">{hint}</p>
    ) : null}
  </div>
);
