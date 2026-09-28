import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/utils/cn";

interface SidebarBrandProps {
  organizationShortName: string;
  className?: string;
  onNavigate?: () => void;
}

export const SidebarBrand = ({
  organizationShortName,
  className,
  onNavigate,
}: SidebarBrandProps) => (
  <Link
    href="/dashboard"
    onClick={onNavigate}
    className={cn(
      "relative flex items-center gap-3 border-b border-sidebar-border px-5 py-[1.15rem]",
      className,
    )}
  >
    <span className="relative flex size-9 items-center justify-center rounded-[0.7rem] bg-gradient-to-br from-brand-400 to-brand-700 shadow-[0_6px_16px_-6px_oklch(0.46_0.09_202/0.9)]">
      <span
        aria-hidden
        className="absolute inset-0 rounded-[0.7rem] ring-1 ring-inset ring-white/25"
      />
      <ShieldCheck className="size-[1.15rem] text-white" aria-hidden />
    </span>

    <span className="min-w-0 leading-tight">
      <span className="font-display block truncate text-[0.9375rem] font-semibold tracking-tight text-white">
        ISMS Platform
      </span>
      <span className="block truncate text-[0.6875rem] uppercase tracking-[0.1em] text-sidebar-muted/70">
        {organizationShortName}
      </span>
    </span>
  </Link>
);
