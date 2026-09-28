import type { ComponentProps } from "react";

import { cn } from "@/shared/utils/cn";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "border-surface-border-strong bg-surface-sunken text-content-muted",
  brand: "border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-800 dark:bg-brand-950/70 dark:text-brand-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
  danger:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
};

const dotStyles: Record<BadgeTone, string> = {
  neutral: "bg-content-subtle",
  brand: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

interface BadgeProps extends ComponentProps<"span"> {
  tone?: BadgeTone;
  /** Adds a status dot — useful when the tone alone has to carry meaning. */
  dot?: boolean;
}

export const Badge = ({ tone = "neutral", dot = false, className, children, ...props }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px]",
      "text-[0.6875rem] font-semibold leading-5 tracking-[0.01em]",
      toneStyles[tone],
      className,
    )}
    {...props}
  >
    {dot ? <span aria-hidden className={cn("size-1.5 rounded-full", dotStyles[tone])} /> : null}
    {children}
  </span>
);
