import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

export const Card = ({ className, ...props }: ComponentProps<"section">) => (
  <section className={cn("surface-card", className)} {...props} />
);

interface CardHeaderProps extends Omit<ComponentProps<"header">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export const CardHeader = ({
  title,
  description,
  action,
  className,
  ...props
}: CardHeaderProps) => (
  <header
    className={cn("flex items-start justify-between gap-4 border-b px-5 py-4", className)}
    {...props}
  >
    <div className="space-y-1">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {description ? <p className="text-sm text-content-muted">{description}</p> : null}
    </div>
    {action}
  </header>
);

export const CardBody = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("px-5 py-4", className)} {...props} />
);
