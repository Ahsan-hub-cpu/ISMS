import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

type Tone = "danger" | "warning" | "success" | "info";

const toneStyles: Record<Tone, string> = {
  danger:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
  info: "border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-200",
};

const toneIcons: Record<Tone, LucideIcon> = {
  danger: AlertCircle,
  warning: TriangleAlert,
  success: CheckCircle2,
  info: Info,
};

interface AlertProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

/** One inline message style so every form reports problems the same way. */
export const Alert = ({ tone = "danger", children, className }: AlertProps) => {
  const Icon = toneIcons[tone];

  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[0.8125rem] leading-relaxed",
        toneStyles[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="min-w-0">{children}</span>
    </p>
  );
};
