import { Shield } from "lucide-react";
import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { authService } from "@/modules/auth";
import { requirePermission } from "@/modules/auth/presentation/guards";

import { CreateRoleForm } from "./create-role-form";
import { RolesTable } from "./roles-table";
import type { RoleRow } from "./types";

export const metadata: Metadata = { title: "Roles" };

export default async function RolesPage() {
  await requirePermission("users:manage");

  const roles = await authService.listRoles();
  const rows: RoleRow[] = roles.map((role) => ({
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: [...role.permissions],
    userCount: role.userCount,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Roles"
        description="Named access profiles. Add custom roles and choose which permissions each one grants."
        actions={<CreateRoleForm />}
      />

      <Card>
        <CardHeader
          icon={Shield}
          title="Access profiles"
          description={`${rows.length} role${rows.length === 1 ? "" : "s"}. System roles can be edited but not deleted.`}
        />
        <CardBody className="p-0">
          <RolesTable roles={rows} />
        </CardBody>
      </Card>
    </>
  );
}
