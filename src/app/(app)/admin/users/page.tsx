import Link from "next/link";
import { Shield, Users } from "lucide-react";
import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { authService } from "@/modules/auth";
import { can } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { organizationService } from "@/modules/organization";

import { CreateUserForm } from "./create-user-form";
import type { RoleOption, SiteOption, UserRow } from "./types";
import { UserTable } from "./user-table";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const session = await requirePermission("users:read");
  const canManage = can(session, "users:manage");

  const [usersResult, organizationResult, roles] = await Promise.all([
    authService.listUsers(),
    organizationService.getProfile(),
    authService.listRoleSummaries(),
  ]);

  const users: UserRow[] = usersResult.ok
    ? usersResult.value.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        jobTitle: user.jobTitle,
        roleId: user.roleId,
        roleName: user.roleName,
        isActive: user.isActive,
        siteId: user.siteId,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      }))
    : [];

  const sites: SiteOption[] = organizationResult.ok
    ? organizationResult.value.sites.map((site) => ({ id: site.id, name: site.name }))
    : [];

  const roleOptions: RoleOption[] = roles.map((role) => ({
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Accounts that may access the ISMS platform. Permissions come from the assigned role."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canManage ? (
              <Link
                href="/admin/roles"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-surface-border-strong bg-surface-raised px-4 text-sm font-medium text-content shadow-[0_1px_2px_oklch(0.35_0.04_220/0.06)] transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 dark:hover:border-brand-700 dark:hover:bg-brand-950/60 dark:hover:text-brand-200"
              >
                <Shield className="size-4" aria-hidden />
                Manage roles
              </Link>
            ) : null}
            {canManage ? <CreateUserForm sites={sites} roles={roleOptions} /> : null}
          </div>
        }
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
            roles={roleOptions}
            canManage={canManage}
            currentUserId={session.id}
          />
        </CardBody>
      </Card>
    </>
  );
}
