import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

export const Card = ({ className, ...props }: ComponentProps<"section">) => (
  <section className={cn("surface-card overflow-hidden", className)} {...props} />
);

interface CardHeaderProps extends Omit<ComponentProps<"header">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Optional glyph that anchors the section visually in dense pages. */
  icon?: LucideIcon;
}

export const CardHeader = ({
  title,
  description,
  action,
  icon: Icon,
  className,
  ...props
}: CardHeaderProps) => (
  <header
    className={cn(
      "flex items-start justify-between gap-4 border-b border-surface-border px-5 py-4",
      className,
    )}
    {...props}
  >
    <div className="flex min-w-0 items-start gap-3">
      {Icon ? (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:ring-brand-900">
          <Icon className="size-4" aria-hidden />
        </span>
      ) : null}
      <div className="min-w-0 space-y-0.5">
        <h2 className="font-display text-[0.9375rem] font-semibold tracking-tight text-content">
          {title}
        </h2>
        {description ? (
          <p className="text-[0.8125rem] leading-relaxed text-content-muted">{description}</p>
        ) : null}
      </div>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </header>
);

export const CardBody = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("px-5 py-4", className)} {...props} />
);

/** Filter strip between a card header and an edge-to-edge table. */
export const CardToolbar = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn(
      "border-b border-surface-border bg-surface-sunken/50 px-5 py-3",
      className,
    )}
    {...props}
  />
);

export const CardFooter = ({ className, ...props }: ComponentProps<"footer">) => (
  <footer
    className={cn(
      "flex flex-wrap items-center justify-end gap-2 border-t border-surface-border bg-surface-sunken/60 px-5 py-3",
      className,
    )}
    {...props}
  />
);
