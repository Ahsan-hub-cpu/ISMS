import "server-only";

import { prisma } from "@/infrastructure/database/prisma";

import { isPermission, type Permission } from "../domain/permissions";
import type { Role, RoleSummary } from "../domain/user";
import type { RoleRepository } from "../application/ports/role-repository";

const roleInclude = {
  permissions: true,
  _count: { select: { users: true } },
} as const;

type RoleRow = Awaited<ReturnType<typeof prisma.role.findFirstOrThrow>> & {
  permissions: { permission: string }[];
  _count: { users: number };
};

const permissionsOf = (row: { permissions: { permission: string }[] }): Permission[] =>
  row.permissions.map((entry) => entry.permission).filter(isPermission);

const toRole = (row: RoleRow): Role => ({
  id: row.id,
  code: row.code,
  name: row.name,
  description: row.description,
  isSystem: row.isSystem,
  permissions: permissionsOf(row),
  userCount: row._count.users,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toSummary = (row: {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}): RoleSummary => ({
  id: row.id,
  code: row.code,
  name: row.name,
  description: row.description,
  isSystem: row.isSystem,
});

export const prismaRoleRepository: RoleRepository = {
  async list() {
    const rows = await prisma.role.findMany({
      include: roleInclude,
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });
    return rows.map(toRole);
  },

  async listSummaries() {
    const rows = await prisma.role.findMany({ orderBy: [{ isSystem: "desc" }, { name: "asc" }] });
    return rows.map(toSummary);
  },

  async findById(id) {
    const row = await prisma.role.findUnique({ where: { id }, include: roleInclude });
    return row ? toRole(row) : null;
  },

  async findByCode(code) {
    const row = await prisma.role.findUnique({ where: { code }, include: roleInclude });
    return row ? toRole(row) : null;
  },

  async create(data) {
    const row = await prisma.role.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        isSystem: data.isSystem,
        permissions: {
          createMany: {
            data: data.permissions.map((permission) => ({ permission })),
          },
        },
      },
      include: roleInclude,
    });
    return toRole(row);
  },

  async update(id, data) {
    const row = await prisma.$transaction(async (tx) => {
      if (data.permissions) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (data.permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: data.permissions.map((permission) => ({ roleId: id, permission })),
          });
        }
      }

      return tx.role.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
        },
        include: roleInclude,
      });
    });

    return toRole(row);
  },

  async delete(id) {
    await prisma.role.delete({ where: { id } });
  },

  async countUsers(roleId) {
    return prisma.user.count({ where: { roleId } });
  },
};
