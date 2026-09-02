"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import type { UserRole } from "@/modules/auth/domain/user";
import { cn } from "@/shared/utils/cn";

import { navigationFor } from "./navigation";

/** The role is passed from the server; icon components cannot cross that boundary. */
export const SidebarNav = ({ role }: { role: UserRole }) => {
  const pathname = usePathname();
  const sections = useMemo(() => navigationFor(role), [role]);

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {sections.map((section) => (
        <div key={section.title} className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-content-muted">
            {section.title}
          </p>

          {section.items.map(({ label, href, icon: Icon, available }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            const baseClass =
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";

            if (!available) {
              return (
                <span
                  key={href}
                  aria-disabled="true"
                  title="Planned in a later module"
                  className={cn(baseClass, "cursor-not-allowed text-content-muted/60")}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wide">soon</span>
                </span>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  baseClass,
                  isActive
                    ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-950/70 dark:text-brand-200"
                    : "text-content-muted hover:bg-slate-100 hover:text-content dark:hover:bg-slate-800/60",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
};
