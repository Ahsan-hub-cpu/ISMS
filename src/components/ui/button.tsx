import type { ComponentProps } from "react";

import { cn } from "@/shared/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  // A hairline inset highlight gives the solid fill depth without a gradient.
  primary:
    "bg-brand-600 text-white shadow-[0_1px_2px_oklch(0.35_0.04_220/0.24),inset_0_1px_0_oklch(1_0_0/0.18)] hover:bg-brand-500 active:bg-brand-700 disabled:bg-brand-300 disabled:shadow-none",
  secondary:
    "border border-surface-border-strong bg-surface-raised text-content shadow-[0_1px_2px_oklch(0.35_0.04_220/0.06)] hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 dark:hover:border-brand-700 dark:hover:bg-brand-950/60 dark:hover:text-brand-200",
  ghost:
    "text-content-muted hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-brand-950/50 dark:hover:text-brand-200",
  danger:
    "bg-rose-600 text-white shadow-[0_1px_2px_oklch(0.35_0.04_220/0.24),inset_0_1px_0_oklch(1_0_0/0.18)] hover:bg-rose-500 active:bg-rose-700 disabled:bg-rose-300 disabled:shadow-none",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-lg px-4 text-sm",
  lg: "h-11 gap-2 rounded-xl px-5 text-sm",
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
      "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium",
      "transition-[background-color,border-color,color,box-shadow,transform] duration-150",
      "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 disabled:active:scale-100",
      "[&_svg]:size-4 [&_svg]:shrink-0",
      variantStyles[variant],
      sizeStyles[size],
      className,
    )}
    {...props}
  />
);
