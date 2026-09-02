import type { ComponentProps } from "react";

import { cn } from "@/shared/utils/cn";

export const Table = ({ className, ...props }: ComponentProps<"table">) => (
  <div className="overflow-x-auto">
    <table className={cn("w-full border-collapse text-sm", className)} {...props} />
  </div>
);

export const THead = ({ className, ...props }: ComponentProps<"thead">) => (
  <thead
    className={cn(
      "border-b text-left text-xs font-medium uppercase tracking-wide text-content-muted",
      className,
    )}
    {...props}
  />
);

export const TH = ({ className, ...props }: ComponentProps<"th">) => (
  <th className={cn("px-4 py-2.5 font-medium", className)} {...props} />
);

export const TR = ({ className, ...props }: ComponentProps<"tr">) => (
  <tr className={cn("border-b last:border-0", className)} {...props} />
);

export const TD = ({ className, ...props }: ComponentProps<"td">) => (
  <td className={cn("px-4 py-3 align-top", className)} {...props} />
);
