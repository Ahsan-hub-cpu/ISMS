import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/infrastructure/database/prisma";
import { paginate, toSkipTake } from "@/shared/core/pagination";

import { REMEDIATION_STATUSES, type RemediationAction, type RemediationStatus } from "../domain/entities";
import type { RemediationRepository } from "../application/ports/remediation-repository";
import type { RemediationQuery } from "../application/schemas";

const OPEN_STATUSES: RemediationStatus[] = ["OPEN", "IN_PROGRESS", "IN_REVIEW"];

const withRelations = {
  gap: { select: { reference: true } },
  control: { select: { code: true, title: true } },
  owner: { select: { fullName: true } },
  comments: {
    orderBy: { createdAt: "asc" },
    include: { author: { select: { fullName: true } } },
  },
  _count: { select: { evidenceLinks: true } },
} satisfies Prisma.RemediationActionInclude;


type ActionRow = Prisma.RemediationActionGetPayload<{ include: typeof withRelations }>;

const toAction = (row: ActionRow): RemediationAction => ({
  id: row.id,
  reference: row.reference,
  title: row.title,
  description: row.description,
  gapId: row.gapId,
  gapReference: row.gap?.reference ?? null,
  controlId: row.controlId,
  controlCode: row.control?.code ?? null,
  controlTitle: row.control?.title ?? null,
  ownerId: row.ownerId,
  ownerName: row.owner?.fullName ?? null,
  priority: row.priority,
  status: row.status,
  progressPercent: row.progressPercent,
  dueAt: row.dueAt,
  completedAt: row.completedAt,
  createdAt: row.createdAt,
  comments: row.comments.map((comment) => ({
    id: comment.id,
    authorName: comment.author?.fullName ?? "Unknown",
    body: comment.body,
    createdAt: comment.createdAt,
  })),
  evidenceCount: row._count.evidenceLinks,
});

const buildWhere = (
  organizationId: string,
  query: RemediationQuery,
): Prisma.RemediationActionWhereInput => ({
  organizationId,
  ...(query.status ? { status: query.status } : {}),
  ...(query.priority ? { priority: query.priority } : {}),
  ...(query.ownerId ? { ownerId: query.ownerId } : {}),
  ...(query.gapId ? { gapId: query.gapId } : {}),
  ...(query.overdueOnly
    ? { status: { in: OPEN_STATUSES }, dueAt: { lt: new Date() } }
    : {}),
  ...(query.search
    ? {
        OR: [
          { reference: { contains: query.search, mode: "insensitive" } },
          { title: { contains: query.search, mode: "insensitive" } },
          { control: { code: { contains: query.search, mode: "insensitive" } } },
        ],
      }
    : {}),
});

export const prismaRemediationRepository: RemediationRepository = {
  async nextReference(organizationId) {
    const count = await prisma.remediationAction.count({ where: { organizationId } });
    return `REM-${String(count + 1).padStart(4, "0")}`;
  },

  async create(data) {
    const row = await prisma.remediationAction.create({
      data: {
        organizationId: data.organizationId,
        reference: data.reference,
        title: data.title,
        description: data.description,
        gapId: data.gapId,
        controlId: data.controlId,
        ownerId: data.ownerId,
        priority: data.priority,
        dueAt: data.dueAt,
        createdById: data.createdById,
      },
      include: withRelations,
    });

    return toAction(row);
  },

  async findById(id) {
    const row = await prisma.remediationAction.findUnique({ where: { id }, include: withRelations });
    return row ? toAction(row) : null;
  },

  async findOpenByGap(gapId) {
    const row = await prisma.remediationAction.findFirst({
      where: { gapId, status: { in: OPEN_STATUSES } },
      include: withRelations,
      orderBy: { createdAt: "asc" },
    });
    return row ? toAction(row) : null;
  },

  countOpenByGap(gapId) {
    return prisma.remediationAction.count({ where: { gapId, status: { in: OPEN_STATUSES } } });
  },

  countPendingEvidence(actionId) {
    return prisma.evidenceLink.count({
      where: { remediationId: actionId, evidence: { reviewStatus: "PENDING" } },
    });
  },

  async list(organizationId, query) {
    const where = buildWhere(organizationId, query);

    const [rows, total] = await Promise.all([
      prisma.remediationAction.findMany({
        where,
        include: withRelations,
        orderBy: [{ status: "asc" }, { dueAt: "asc" }],
        ...toSkipTake(query),
      }),
      prisma.remediationAction.count({ where }),
    ]);

    return paginate(rows.map(toAction), total, query);
  },

  async update(id, changes, completedAt) {
    const row = await prisma.remediationAction.update({
      where: { id },
      data: {
        ...(changes.title !== undefined ? { title: changes.title } : {}),
        ...(changes.description !== undefined ? { description: changes.description } : {}),
        ...(changes.priority !== undefined ? { priority: changes.priority } : {}),
        ...(changes.status !== undefined ? { status: changes.status } : {}),
        ...(changes.progressPercent !== undefined
          ? { progressPercent: changes.progressPercent }
          : {}),
        ...(changes.dueAt !== undefined
          ? { dueAt: changes.dueAt ? new Date(changes.dueAt) : null }
          : {}),
        ...(changes.ownerId !== undefined
          ? { owner: changes.ownerId ? { connect: { id: changes.ownerId } } : { disconnect: true } }
          : {}),
        completedAt,
      },
      include: withRelations,
    });

    return toAction(row);
  },

  async moveOpenActionsToReview(gapId) {
    await prisma.remediationAction.updateMany({
      where: { gapId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      data: { status: "IN_REVIEW", progressPercent: 90 },
    });
  },

  async addComment(actionId, authorId, body) {
    await prisma.remediationComment.create({
      data: { remediationId: actionId, authorId, body },
    });
  },

  async summarise(organizationId) {
    const [grouped, total, overdue] = await Promise.all([
      prisma.remediationAction.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: { _all: true },
      }),
      prisma.remediationAction.count({ where: { organizationId } }),
      prisma.remediationAction.count({
        where: { organizationId, status: { in: OPEN_STATUSES }, dueAt: { lt: new Date() } },
      }),
    ]);

    const byStatus = Object.fromEntries(
      REMEDIATION_STATUSES.map((status) => [
        status,
        grouped.find((group) => group.status === status)?._count._all ?? 0,
      ]),
    ) as Record<RemediationStatus, number>;

    return {
      total,
      outstanding: OPEN_STATUSES.reduce((sum, status) => sum + byStatus[status], 0),
      overdue,
      completed: byStatus.COMPLETED,
      byStatus,
    };
  },
};
