import type { ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "danger" | "warning" | "success";
}

const valueTone = {
  neutral: "",
  danger: "text-rose-600 dark:text-rose-400",
  warning: "text-amber-600 dark:text-amber-400",
  success: "text-emerald-600 dark:text-emerald-400",
};

export const Stat = ({ label, value, hint, tone = "neutral" }: StatProps) => (
  <div className="surface-card px-4 py-3.5">
    <p className="text-xs font-medium uppercase tracking-wide text-content-muted">{label}</p>
    <p className={cn("mt-1 text-2xl font-semibold tabular-nums", valueTone[tone])}>{value}</p>
    {hint ? <p className="mt-0.5 text-xs text-content-muted">{hint}</p> : null}
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
    <div className={cn("space-y-1", className)}>
      {label ? (
        <div className="flex items-center justify-between text-xs text-content-muted">
          <span>{label}</span>
          <span className="tabular-nums">{clamped}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
