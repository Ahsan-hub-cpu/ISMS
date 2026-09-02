import "server-only";

import type { User as PrismaUser } from "@prisma/client";

import { prisma } from "@/infrastructure/database/prisma";

import type { User, UserWithCredentials } from "../domain/user";
import type { UserRepository } from "../application/ports/user-repository";

const toUser = (row: PrismaUser): User => ({
  id: row.id,
  email: row.email,
  fullName: row.fullName,
  jobTitle: row.jobTitle,
  role: row.role,
  isActive: row.isActive,
  siteId: row.siteId,
  lastLoginAt: row.lastLoginAt,
  createdAt: row.createdAt,
});

const toUserWithCredentials = (row: PrismaUser): UserWithCredentials => ({
  ...toUser(row),
  passwordHash: row.passwordHash,
});

export const prismaUserRepository: UserRepository = {
  async findById(id) {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  },

  async findByEmail(email) {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? toUserWithCredentials(row) : null;
  },

  async existsByEmail(email) {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  },

  async list() {
    const rows = await prisma.user.findMany({ orderBy: [{ isActive: "desc" }, { fullName: "asc" }] });
    return rows.map(toUser);
  },

  async create(data) {
    const row = await prisma.user.create({ data });
    return toUser(row);
  },

  async update(id, data) {
    const row = await prisma.user.update({ where: { id }, data });
    return toUser(row);
  },

  async recordSignIn(id, at) {
    await prisma.user.update({ where: { id }, data: { lastLoginAt: at } });
  },

  async countByRole(role, options) {
    return prisma.user.count({
      where: { role, ...(options?.activeOnly ? { isActive: true } : {}) },
    });
  },
};
