import type { ComponentProps } from "react";

import { cn } from "@/shared/utils/cn";

export const Table = ({ className, ...props }: ComponentProps<"table">) => (
  <div className="overflow-x-auto">
    <table
      className={cn("w-full min-w-full border-collapse text-sm", className)}
      {...props}
    />
  </div>
);

export const THead = ({ className, ...props }: ComponentProps<"thead">) => (
  <thead
    className={cn(
      "border-b border-surface-border bg-surface-sunken/70 text-left",
      "text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-content-subtle",
      className,
    )}
    {...props}
  />
);

export const TH = ({ className, ...props }: ComponentProps<"th">) => (
  <th className={cn("px-4 py-3 font-semibold", className)} {...props} />
);

export const TR = ({ className, ...props }: ComponentProps<"tr">) => (
  <tr
    className={cn(
      "border-b border-surface-border transition-colors last:border-0 hover:bg-brand-50/45 dark:hover:bg-brand-950/25",
      className,
    )}
    {...props}
  />
);

export const TD = ({ className, ...props }: ComponentProps<"td">) => (
  <td className={cn("px-4 py-3.5 align-top", className)} {...props} />
);
