"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import type { Permission } from "@/modules/auth/domain/permissions";
import { cn } from "@/shared/utils/cn";

import { navigationFor } from "./navigation";

interface SidebarNavProps {
  permissions: readonly Permission[];
  /** Closes the mobile drawer once a destination is picked. */
  onNavigate?: () => void;
}

/** Permissions are passed from the server; icon components cannot cross that boundary. */
export const SidebarNav = ({ permissions, onNavigate }: SidebarNavProps) => {
  const pathname = usePathname();
  const sections = useMemo(() => navigationFor({ permissions }), [permissions]);

  return (
    <nav className="relative flex-1 space-y-7 overflow-y-auto px-3 py-5">
      {sections.map((section) => (
        <div key={section.title} className="space-y-1">
          <p className="px-3 pb-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-sidebar-muted/60">
            {section.title}
          </p>

          {section.items.map(({ label, href, icon: Icon, available }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            const baseClass =
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[0.8125rem] transition-colors duration-150";

            if (!available) {
              return (
                <span
                  key={href}
                  aria-disabled="true"
                  title="Planned in a later module"
                  className={cn(baseClass, "cursor-not-allowed text-sidebar-muted/40")}
                >
                  <Icon className="size-[1.05rem] shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                  <span className="ml-auto text-[0.625rem] uppercase tracking-wide">soon</span>
                </span>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  baseClass,
                  isActive
                    ? "bg-white/[0.09] font-semibold text-white"
                    : "font-medium text-sidebar-muted hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-1.5 -left-3 w-[3px] rounded-r-full bg-brand-400 transition-opacity duration-150",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon
                  className={cn(
                    "size-[1.05rem] shrink-0 transition-colors",
                    isActive ? "text-brand-300" : "text-sidebar-muted group-hover:text-brand-300",
                  )}
                  aria-hidden
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
};
