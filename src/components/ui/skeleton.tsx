import type { ComponentProps } from "react";

import { cn } from "@/shared/utils/cn";

export const Skeleton = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    aria-hidden
    className={cn("animate-pulse rounded-md bg-surface-sunken", className)}
    {...props}
  />
);
