import type { ReactNode } from "react";

import type { SessionUser } from "@/modules/auth/domain/user";

import { MobileNav } from "./mobile-nav";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

interface AppShellProps {
  children: ReactNode;
  user: SessionUser;
  organizationName: string;
  organizationShortName: string;
}

export const AppShell = ({
  children,
  user,
  organizationName,
  organizationShortName,
}: AppShellProps) => (
  <div className="flex min-h-dvh bg-surface">
    <aside className="sticky top-0 hidden h-dvh w-[16.5rem] shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-white lg:flex">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(28rem_20rem_at_15%_-5%,oklch(0.55_0.11_198/0.4),transparent_65%),radial-gradient(24rem_18rem_at_90%_105%,oklch(0.5_0.09_70/0.18),transparent_70%)]"
      />

      <SidebarBrand organizationShortName={organizationShortName} />
      <SidebarNav permissions={user.permissions} />

      <div className="relative border-t border-sidebar-border px-5 py-3.5">
        <p className="text-[0.625rem] uppercase tracking-[0.14em] text-sidebar-muted/50">
          Academic project scenario
        </p>
      </div>
    </aside>

    <div className="app-canvas flex min-w-0 flex-1 flex-col">
      <header className="surface-glass sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-surface-border px-4 sm:px-6">
        <MobileNav permissions={user.permissions} organizationShortName={organizationShortName} />

        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] font-semibold tracking-tight text-content">
            {organizationName}
          </p>
          <p className="hidden text-[0.6875rem] text-content-subtle sm:block">
            Information security management system
          </p>
        </div>

        <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-[0.6875rem] font-semibold tracking-tight text-brand-800 md:inline-flex dark:border-brand-800 dark:bg-brand-950/70 dark:text-brand-200">
          <span aria-hidden className="size-1.5 rounded-full bg-brand-500" />
          ISO/IEC 27001:2022
        </span>

        <div className="ml-auto md:ml-4">
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-7 sm:px-6 lg:py-9">
        {children}
      </main>
    </div>
  </div>
);
