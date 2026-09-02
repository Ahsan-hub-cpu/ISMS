import type { ComponentProps } from "react";

import { cn } from "@/shared/utils/cn";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

interface BadgeProps extends ComponentProps<"span"> {
  tone?: BadgeTone;
}

export const Badge = ({ tone = "neutral", className, ...props }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
      toneStyles[tone],
      className,
    )}
    {...props}
  />
);
