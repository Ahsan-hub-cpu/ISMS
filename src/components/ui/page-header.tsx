import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Short label above the title, e.g. the module or framework name. */
  eyebrow?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, description, eyebrow, actions }: PageHeaderProps) => (
  <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-6">
    <span
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-300/70 via-surface-border to-transparent"
    />

    <div className="min-w-0 space-y-1.5">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.022em] text-content">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-content-muted">{description}</p>
      ) : null}
    </div>

    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);
