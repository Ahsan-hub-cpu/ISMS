"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { UserRole } from "@/modules/auth/domain/user";

import { SidebarBrand } from "./sidebar-brand";
import { SidebarNav } from "./sidebar-nav";

interface MobileNavProps {
  role: UserRole;
  organizationShortName: string;
}

/** Drawer version of the sidebar; the desktop aside is hidden below `lg`. */
export const MobileNav = ({ role, organizationShortName }: MobileNavProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="flex size-9 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-sunken hover:text-content lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="animate-overlay-in absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-[2px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="animate-dialog-in absolute inset-y-0 left-0 flex w-[17rem] flex-col bg-sidebar text-white shadow-[var(--shadow-modal)]"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 z-10 flex size-8 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" aria-hidden />
            </button>

            <SidebarBrand
              organizationShortName={organizationShortName}
              onNavigate={() => setOpen(false)}
            />
            <SidebarNav role={role} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
};
