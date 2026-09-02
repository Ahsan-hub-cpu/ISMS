import "server-only";

import type { AuditLogEntry as PrismaAuditEntry } from "@prisma/client";

import { prisma } from "@/infrastructure/database/prisma";
import { paginate, toSkipTake } from "@/shared/core/pagination";

import type { AuditEntry } from "../domain/entities";
import type { AuditRepository } from "../application/ports/audit-repository";

const toEntry = (row: PrismaAuditEntry): AuditEntry => ({
  id: row.id,
  actorId: row.actorId,
  actorEmail: row.actorEmail,
  actorName: row.actorName,
  action: row.action,
  entityType: row.entityType,
  entityId: row.entityId,
  summary: row.summary,
  createdAt: row.createdAt,
});

export const prismaAuditRepository: AuditRepository = {
  async record(draft) {
    await prisma.auditLogEntry.create({
      data: {
        actorId: draft.actor?.id ?? null,
        actorEmail: draft.actor?.email ?? "system",
        actorName: draft.actor?.fullName ?? "System",
        action: draft.action,
        entityType: draft.entityType,
        entityId: draft.entityId ?? null,
        summary: draft.summary,
      },
    });
  },

  async list(filter) {
    const where = {
      ...(filter.entityType ? { entityType: filter.entityType } : {}),
      ...(filter.actorId ? { actorId: filter.actorId } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.auditLogEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...toSkipTake(filter),
      }),
      prisma.auditLogEntry.count({ where }),
    ]);

    return paginate(rows.map(toEntry), total, filter);
  },

  async listEntityTypes() {
    const rows = await prisma.auditLogEntry.findMany({
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
    });

    return rows.map((row) => row.entityType);
  },
};
