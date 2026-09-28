import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

type Tone = "neutral" | "danger" | "warning" | "success" | "brand";

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
}

const accentTone: Record<Tone, string> = {
  neutral: "bg-slate-300 dark:bg-slate-600",
  danger: "bg-rose-500",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
  brand: "bg-brand-500",
};

const chipTone: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-content-muted ring-surface-border",
  danger: "bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-900",
  warning:
    "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900",
  success:
    "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900",
  brand: "bg-brand-50 text-brand-700 ring-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:ring-brand-900",
};

const valueTone: Record<Tone, string> = {
  neutral: "text-content",
  danger: "text-rose-600 dark:text-rose-400",
  warning: "text-amber-600 dark:text-amber-400",
  success: "text-emerald-600 dark:text-emerald-400",
  brand: "text-brand-700 dark:text-brand-300",
};

export const Stat = ({ label, value, hint, tone = "neutral", icon: Icon }: StatProps) => (
  <div className="surface-card hover-lift relative isolate flex items-start gap-3 px-4 py-4">
    {/* Full-height accent rail reads as a status cue without colouring the whole card. */}
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-3 left-0 w-[3px] rounded-r-full",
        accentTone[tone],
      )}
    />

    <div className="min-w-0 flex-1 pl-2">
      <p className="eyebrow truncate">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-display text-[1.75rem] font-semibold leading-none tabular-nums",
          valueTone[tone],
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs leading-relaxed text-content-muted">{hint}</p>
      ) : null}
    </div>

    {Icon ? (
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
          chipTone[tone],
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
    ) : null}
  </div>
);

interface ProgressProps {
  value: number;
  label?: string;
  className?: string;
}

export const Progress = ({ value, label, className }: ProgressProps) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span className="min-w-0 truncate text-content-muted">{label}</span>
          <span className="font-display font-semibold tabular-nums text-content">{clamped}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken ring-1 ring-inset ring-surface-border"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
