import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
    <span className="relative flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:ring-brand-900">
      <span
        aria-hidden
        className="absolute -inset-2 rounded-[1.25rem] bg-brand-500/5 blur-md"
      />
      <Icon className="relative size-6" aria-hidden />
    </span>

    <div className="space-y-1.5">
      <p className="font-display text-base font-semibold tracking-tight text-content">{title}</p>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-content-muted">{description}</p>
    </div>

    {action ? <div className="pt-1">{action}</div> : null}
  </div>
);
