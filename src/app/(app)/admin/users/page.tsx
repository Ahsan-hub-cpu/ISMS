import { ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { authService } from "@/modules/auth";
import { can } from "@/modules/auth/domain/permissions";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, USER_ROLES } from "@/modules/auth/domain/user";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { organizationService } from "@/modules/organization";

import { CreateUserForm } from "./create-user-form";
import type { SiteOption, UserRow } from "./types";
import { UserTable } from "./user-table";

export const metadata: Metadata = { title: "Users & Roles" };

export default async function UsersPage() {
  const session = await requirePermission("users:read");
  const canManage = can(session.role, "users:manage");

  const [usersResult, organizationResult] = await Promise.all([
    authService.listUsers(),
    organizationService.getProfile(),
  ]);

  const users: UserRow[] = usersResult.ok
    ? usersResult.value.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        jobTitle: user.jobTitle,
        role: user.role,
        isActive: user.isActive,
        siteId: user.siteId,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      }))
    : [];

  const sites: SiteOption[] = organizationResult.ok
    ? organizationResult.value.sites.map((site) => ({ id: site.id, name: site.name }))
    : [];

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Users & Roles"
        description="Accounts that may access the ISMS platform and the permissions attached to each role."
        actions={canManage ? <CreateUserForm sites={sites} /> : null}
      />

      <Card>
        <CardHeader
          icon={Users}
          title="Accounts"
          description={`${users.length} account${users.length === 1 ? "" : "s"} registered.`}
        />
        <CardBody className="p-0">
          <UserTable
            users={users}
            sites={sites}
            canManage={canManage}
            currentUserId={session.id}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={ShieldCheck}
          title="Role definitions"
          description="Permissions are derived from the role, so screens and endpoints check permissions rather than roles."
        />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          {USER_ROLES.map((role) => (
            <div
              key={role}
              className="relative overflow-hidden rounded-xl border border-surface-border bg-surface-sunken/50 px-4 py-3.5"
            >
              <span
                aria-hidden
                className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-brand-400"
              />
              <p className="pl-2 text-sm font-semibold text-content">{ROLE_LABELS[role]}</p>
              <p className="mt-1 pl-2 text-xs leading-relaxed text-content-muted">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  );
}
