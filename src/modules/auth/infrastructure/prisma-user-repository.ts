import "server-only";

import type { Role as PrismaRole, User as PrismaUser } from "@prisma/client";

import { prisma } from "@/infrastructure/database/prisma";

import { isPermission, type Permission } from "../domain/permissions";
import type { User, UserWithCredentials } from "../domain/user";
import type { UserRepository } from "../application/ports/user-repository";

type UserRow = PrismaUser & {
  role: PrismaRole & { permissions: { permission: string }[] };
};

const permissionsOf = (row: UserRow): Permission[] =>
  row.role.permissions
    .map((entry) => entry.permission)
    .filter(isPermission);

const toUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  fullName: row.fullName,
  jobTitle: row.jobTitle,
  roleId: row.roleId,
  roleCode: row.role.code,
  roleName: row.role.name,
  permissions: permissionsOf(row),
  isActive: row.isActive,
  siteId: row.siteId,
  lastLoginAt: row.lastLoginAt,
  createdAt: row.createdAt,
});

const toUserWithCredentials = (row: UserRow): UserWithCredentials => ({
  ...toUser(row),
  passwordHash: row.passwordHash,
});

const userInclude = {
  role: { include: { permissions: true } },
} as const;

export const prismaUserRepository: UserRepository = {
  async findById(id) {
    const row = await prisma.user.findUnique({ where: { id }, include: userInclude });
    return row ? toUser(row) : null;
  },

  async findByEmail(email) {
    const row = await prisma.user.findUnique({ where: { email }, include: userInclude });
    return row ? toUserWithCredentials(row) : null;
  },

  async existsByEmail(email) {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  },

  async list() {
    const rows = await prisma.user.findMany({
      include: userInclude,
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
    });
    return rows.map(toUser);
  },

  async create(data) {
    const row = await prisma.user.create({ data, include: userInclude });
    return toUser(row);
  },

  async update(id, data) {
    const row = await prisma.user.update({ where: { id }, data, include: userInclude });
    return toUser(row);
  },

  async recordSignIn(id, at) {
    await prisma.user.update({ where: { id }, data: { lastLoginAt: at } });
  },

  async countByRoleId(roleId, options) {
    return prisma.user.count({
      where: { roleId, ...(options?.activeOnly ? { isActive: true } : {}) },
    });
  },
};
