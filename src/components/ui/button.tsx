import type { ComponentProps } from "react";

import { cn } from "@/shared/utils/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300",
  secondary:
    "border bg-surface-raised text-content hover:bg-slate-50 dark:hover:bg-slate-800/60",
  ghost: "text-content-muted hover:bg-slate-100 hover:text-content dark:hover:bg-slate-800/60",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
}

export const Button = ({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70",
      variantStyles[variant],
      sizeStyles[size],
      className,
    )}
    {...props}
  />
);
