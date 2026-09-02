"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { ROLE_LABELS, USER_ROLES, type UserRole } from "@/modules/auth/domain/user";
import type { ApiResponse } from "@/shared/api/http";

import type { SiteOption, UserRow } from "./types";

interface UserTableProps {
  users: UserRow[];
  sites: SiteOption[];
  canManage: boolean;
  currentUserId: string;
}

const formatLastLogin = (value: string | null) =>
  value ? new Date(value).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : "Never";

export const UserTable = ({ users, sites, canManage, currentUserId }: UserTableProps) => {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyChange = async (userId: string, changes: Record<string, unknown>) => {
    setPendingId(userId);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      const payload: ApiResponse<unknown> = await response.json();

      if (!response.ok) {
        setError("error" in payload ? payload.error.message : "The update could not be saved.");
        return;
      }

      router.refresh();
    } finally {
      setPendingId(null);
    }
  };

  const siteName = (siteId: string | null) =>
    sites.find((site) => site.id === siteId)?.name ?? "All sites";

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-content-muted">
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Site</th>
              <th className="px-3 py-2 font-medium">Last sign-in</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const isPending = pendingId === user.id;

              return (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="px-3 py-3">
                    <span className="block font-medium">{user.fullName}</span>
                    <span className="block text-xs text-content-muted">{user.email}</span>
                    {user.jobTitle ? (
                      <span className="block text-xs text-content-muted">{user.jobTitle}</span>
                    ) : null}
                  </td>

                  <td className="px-3 py-3">
                    {canManage ? (
                      <Select
                        aria-label={`Role for ${user.fullName}`}
                        value={user.role}
                        disabled={isPending}
                        onChange={(event) =>
                          applyChange(user.id, { role: event.target.value as UserRole })
                        }
                        className="h-9 w-56"
                      >
                        {USER_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      ROLE_LABELS[user.role]
                    )}
                  </td>

                  <td className="px-3 py-3 text-content-muted">{siteName(user.siteId)}</td>

                  <td className="px-3 py-3 text-content-muted">{formatLastLogin(user.lastLoginAt)}</td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Badge tone={user.isActive ? "success" : "neutral"}>
                        {user.isActive ? "Active" : "Disabled"}
                      </Badge>

                      {canManage && user.id !== currentUserId ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => applyChange(user.id, { isActive: !user.isActive })}
                        >
                          {user.isActive ? "Disable" : "Enable"}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
