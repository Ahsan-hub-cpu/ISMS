import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { SessionUser } from "@/modules/auth/domain/user";

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
  <div className="flex min-h-dvh">
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-surface-raised lg:flex">
      <Link href="/dashboard" className="flex items-center gap-3 border-b px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold">ISMS Platform</span>
          <span className="block text-xs text-content-muted">{organizationShortName}</span>
        </span>
      </Link>

      <SidebarNav role={user.role} />

      <p className="border-t px-5 py-3 text-[11px] text-content-muted">
        Academic project scenario
      </p>
    </aside>

    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-surface-raised/80 px-5 backdrop-blur">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white lg:hidden">
          <ShieldCheck className="size-4" aria-hidden />
        </span>
        <p className="truncate text-sm font-medium">{organizationName}</p>
        <span className="ml-auto hidden rounded-full border px-3 py-1 text-xs text-content-muted md:inline">
          ISO/IEC 27001:2022
        </span>
        <UserMenu user={user} />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-5 py-6">{children}</main>
    </div>
  </div>
);
