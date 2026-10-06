"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import type { ApiResponse } from "@/shared/api/http";

import type { RoleOption, SiteOption, UserRow } from "./types";

interface UserTableProps {
  users: UserRow[];
  sites: SiteOption[];
  roles: RoleOption[];
  canManage: boolean;
  currentUserId: string;
}

const formatLastLogin = (value: string | null) =>
  value ? new Date(value).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : "Never";

export const UserTable = ({ users, sites, roles, canManage, currentUserId }: UserTableProps) => {
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
    <div>
      {error ? (
        <p
          role="alert"
          className="mx-5 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
        >
          {error}
        </p>
      ) : null}

      <Table className="min-w-[720px]">
        <THead>
          <TR>
            <TH>User</TH>
            <TH>Role</TH>
            <TH>Site</TH>
            <TH>Last sign-in</TH>
            <TH>Status</TH>
          </TR>
        </THead>

        <tbody>
          {users.map((user) => {
            const isPending = pendingId === user.id;

            return (
              <TR key={user.id}>
                <TD>
                  <span className="block text-sm font-semibold text-content">{user.fullName}</span>
                  <span className="block text-xs text-content-muted">{user.email}</span>
                  {user.jobTitle ? (
                    <span className="block text-xs text-content-subtle">{user.jobTitle}</span>
                  ) : null}
                </TD>

                <TD>
                  {canManage ? (
                    <Select
                      aria-label={`Role for ${user.fullName}`}
                      value={user.roleId}
                      disabled={isPending}
                      onChange={(event) => applyChange(user.id, { roleId: event.target.value })}
                      className="h-9 w-56"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <span className="text-sm">{user.roleName}</span>
                  )}
                </TD>

                <TD className="text-sm text-content-muted">{siteName(user.siteId)}</TD>

                <TD className="text-sm text-content-muted">{formatLastLogin(user.lastLoginAt)}</TD>

                <TD>
                  <div className="flex items-center gap-2">
                    <Badge tone={user.isActive ? "success" : "neutral"} dot>
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
                </TD>
              </TR>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};
