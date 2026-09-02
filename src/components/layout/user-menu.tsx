"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ROLE_LABELS, initialsOf, type SessionUser } from "@/modules/auth/domain/user";

export const UserMenu = ({ user }: { user: SessionUser }) => {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-right leading-tight sm:block">
        <span className="block text-sm font-medium">{user.fullName}</span>
        <span className="block text-xs text-content-muted">{ROLE_LABELS[user.role]}</span>
      </span>

      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-200"
      >
        {initialsOf(user.fullName)}
      </span>

      <button
        type="button"
        onClick={signOut}
        disabled={isSigningOut}
        title="Sign out"
        aria-label="Sign out"
        className="rounded-lg p-2 text-content-muted transition-colors hover:bg-slate-100 hover:text-content disabled:opacity-60 dark:hover:bg-slate-800/60"
      >
        <LogOut className="size-4" aria-hidden />
      </button>
    </div>
  );
};
