"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ROLE_LABELS, initialsOf, type SessionUser } from "@/modules/auth/domain/user";

export const UserMenu = ({ user }: { user: SessionUser }) => {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const signOut = async () => {
    setIsSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full border border-transparent py-1 pl-1 pr-2 transition-colors hover:border-surface-border hover:bg-surface-sunken"
      >
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[0.6875rem] font-bold tracking-wide text-white ring-1 ring-inset ring-white/20"
        >
          {initialsOf(user.fullName)}
        </span>

        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[10rem] truncate text-[0.8125rem] font-semibold text-content">
            {user.fullName}
          </span>
          <span className="block max-w-[10rem] truncate text-[0.6875rem] text-content-subtle">
            {ROLE_LABELS[user.role]}
          </span>
        </span>

        <ChevronDown className="size-4 text-content-subtle" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="animate-dialog-in absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-surface-border bg-surface-raised shadow-[var(--shadow-raised)]"
        >
          <div className="border-b border-surface-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-content">{user.fullName}</p>
            <p className="truncate text-xs text-content-muted">{user.email}</p>
            <p className="mt-2 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-brand-800 dark:bg-brand-950/70 dark:text-brand-200">
              {ROLE_LABELS[user.role]}
            </p>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={isSigningOut}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-content-muted transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
          >
            <LogOut className="size-4" aria-hidden />
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
};
