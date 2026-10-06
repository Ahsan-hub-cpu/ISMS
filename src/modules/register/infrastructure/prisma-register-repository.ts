import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/infrastructure/database/prisma";
import { paginate, toSkipTake } from "@/shared/core/pagination";

import {
  IMPLEMENTATION_STATUSES,
  implementationPercent,
  type ImplementationStatus,
  type RegisterEntry,
} from "../domain/entities";
import type { RegisterRepository } from "../application/ports/register-repository";
import type { RegisterQuery, UpdateRegisterEntryInput } from "../application/schemas";

const withRelations = {
  control: { include: { theme: true } },
  owner: true,
  site: true,
} satisfies Prisma.RegisterEntryInclude;

type RegisterRow = Prisma.RegisterEntryGetPayload<{ include: typeof withRelations }>;

const OUTSTANDING_GAP = ["OPEN", "IN_PROGRESS", "AWAITING_REVIEW"] as const;

const toEntry = (row: RegisterRow, closureLocked = false): RegisterEntry => ({
  id: row.id,
  organizationId: row.organizationId,
  controlId: row.controlId,
  controlCode: row.control.code,
  controlTitle: row.control.title,
  themeCode: row.control.theme.code,
  themeName: row.control.theme.name,
  ownerId: row.ownerId,
  ownerName: row.owner?.fullName ?? null,
  siteId: row.siteId,
  siteName: row.site?.name ?? null,
  applicability: row.applicability,
  justification: row.justification,
  implementationStatus: row.implementationStatus,
  implementationNotes: row.implementationNotes,
  reviewDueAt: row.reviewDueAt,
  updatedAt: row.updatedAt,
  closureLocked,
});

const closureLocksFor = async (
  organizationId: string,
  controlIds: readonly string[],
): Promise<Set<string>> => {
  if (controlIds.length === 0) return new Set();

  const [resolved, outstanding] = await Promise.all([
    prisma.gap.findMany({
      where: {
        controlId: { in: [...controlIds] },
        status: "RESOLVED",
        assessment: { organizationId },
      },
      select: { controlId: true },
      distinct: ["controlId"],
    }),
    prisma.gap.findMany({
      where: {
        controlId: { in: [...controlIds] },
        status: { in: [...OUTSTANDING_GAP] },
        assessment: { organizationId },
      },
      select: { controlId: true },
      distinct: ["controlId"],
    }),
  ]);

  const outstandingIds = new Set(outstanding.map((row) => row.controlId));
  return new Set(
    resolved.map((row) => row.controlId).filter((controlId) => !outstandingIds.has(controlId)),
  );
};

const buildWhere = (
  organizationId: string,
  query: RegisterQuery,
): Prisma.RegisterEntryWhereInput => ({
  organizationId,
  ...(query.status ? { implementationStatus: query.status } : {}),
  ...(query.applicability ? { applicability: query.applicability } : {}),
  ...(query.ownerId ? { ownerId: query.ownerId } : {}),
  ...(query.unassignedOnly ? { ownerId: null } : {}),
  ...(query.themeCode ? { control: { theme: { code: query.themeCode } } } : {}),
  ...(query.search
    ? {
        control: {
          ...(query.themeCode ? { theme: { code: query.themeCode } } : {}),
          OR: [
            { code: { contains: query.search, mode: "insensitive" } },
            { title: { contains: query.search, mode: "insensitive" } },
          ],
        },
      }
    : {}),
});

const toUpdateData = (changes: UpdateRegisterEntryInput): Prisma.RegisterEntryUpdateInput => ({
  ...(changes.applicability !== undefined ? { applicability: changes.applicability } : {}),
  ...(changes.justification !== undefined ? { justification: changes.justification } : {}),
  ...(changes.implementationStatus !== undefined
    ? { implementationStatus: changes.implementationStatus }
    : {}),
  ...(changes.implementationNotes !== undefined
    ? { implementationNotes: changes.implementationNotes }
    : {}),
  ...(changes.reviewDueAt !== undefined
    ? { reviewDueAt: changes.reviewDueAt ? new Date(changes.reviewDueAt) : null }
    : {}),
  ...(changes.ownerId !== undefined
    ? { owner: changes.ownerId ? { connect: { id: changes.ownerId } } : { disconnect: true } }
    : {}),
  ...(changes.siteId !== undefined
    ? { site: changes.siteId ? { connect: { id: changes.siteId } } : { disconnect: true } }
    : {}),
});

export const prismaRegisterRepository: RegisterRepository = {
  async list(organizationId, query) {
    const where = buildWhere(organizationId, query);

    const [rows, total] = await Promise.all([
      prisma.registerEntry.findMany({
        where,
        include: withRelations,
        orderBy: { control: { sortOrder: "asc" } },
        ...toSkipTake(query),
      }),
      prisma.registerEntry.count({ where }),
    ]);

    const locked = await closureLocksFor(
      organizationId,
      rows.map((row) => row.controlId),
    );

    return paginate(
      rows.map((row) => toEntry(row, locked.has(row.controlId))),
      total,
      query,
    );
  },

  async findById(id) {
    const row = await prisma.registerEntry.findUnique({ where: { id }, include: withRelations });
    if (!row) return null;
    const locked = await closureLocksFor(row.organizationId, [row.controlId]);
    return toEntry(row, locked.has(row.controlId));
  },

  async findByControl(organizationId, controlId) {
    const row = await prisma.registerEntry.findUnique({
      where: { organizationId_controlId: { organizationId, controlId } },
      include: withRelations,
    });
    if (!row) return null;
    const locked = await closureLocksFor(organizationId, [controlId]);
    return toEntry(row, locked.has(controlId));
  },

  async update(id, changes) {
    const row = await prisma.registerEntry.update({
      where: { id },
      data: toUpdateData(changes),
      include: withRelations,
    });
    const locked = await closureLocksFor(row.organizationId, [row.controlId]);
    return toEntry(row, locked.has(row.controlId));
  },

  async summarise(organizationId) {
    const [grouped, total, excluded, unassigned, overdueReviews] = await Promise.all([
      prisma.registerEntry.groupBy({
        by: ["implementationStatus"],
        where: { organizationId, applicability: "APPLICABLE" },
        _count: { _all: true },
      }),
      prisma.registerEntry.count({ where: { organizationId } }),
      prisma.registerEntry.count({ where: { organizationId, applicability: "NOT_APPLICABLE" } }),
      prisma.registerEntry.count({
        where: { organizationId, applicability: "APPLICABLE", ownerId: null },
      }),
      prisma.registerEntry.count({
        where: { organizationId, reviewDueAt: { lt: new Date() } },
      }),
    ]);

    const byStatus = Object.fromEntries(
      IMPLEMENTATION_STATUSES.map((status) => [
        status,
        grouped.find((group) => group.implementationStatus === status)?._count._all ?? 0,
      ]),
    ) as Record<ImplementationStatus, number>;

    return {
      total,
      applicable: total - excluded,
      excluded,
      unassigned,
      overdueReviews,
      byStatus,
      implementationPercent: implementationPercent(byStatus),
    };
  },

  async createMissingEntries(organizationId, frameworkId) {
    const [controls, existing] = await Promise.all([
      prisma.control.findMany({ where: { frameworkId }, select: { id: true } }),
      prisma.registerEntry.findMany({ where: { organizationId }, select: { controlId: true } }),
    ]);

    const known = new Set(existing.map((entry) => entry.controlId));
    const missing = controls.filter((control) => !known.has(control.id));

    if (missing.length === 0) return 0;

    const created = await prisma.registerEntry.createMany({
      data: missing.map((control) => ({ organizationId, controlId: control.id })),
      skipDuplicates: true,
    });

    return created.count;
  },

  async listApplicableControlIds(organizationId, frameworkId) {
    const rows = await prisma.registerEntry.findMany({
      where: { organizationId, applicability: "APPLICABLE", control: { frameworkId } },
      select: { controlId: true },
    });

    return rows.map((row) => row.controlId);
  },

  async implementationStatusFor(organizationId, controlId) {
    const row = await prisma.registerEntry.findUnique({
      where: { organizationId_controlId: { organizationId, controlId } },
      select: { implementationStatus: true },
    });

    return row?.implementationStatus ?? null;
  },
};
