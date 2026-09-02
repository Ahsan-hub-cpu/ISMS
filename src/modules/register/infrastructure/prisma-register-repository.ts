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

const toEntry = (row: RegisterRow): RegisterEntry => ({
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
});

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

    return paginate(rows.map(toEntry), total, query);
  },

  async findById(id) {
    const row = await prisma.registerEntry.findUnique({ where: { id }, include: withRelations });
    return row ? toEntry(row) : null;
  },

  async findByControl(organizationId, controlId) {
    const row = await prisma.registerEntry.findUnique({
      where: { organizationId_controlId: { organizationId, controlId } },
      include: withRelations,
    });
    return row ? toEntry(row) : null;
  },

  async update(id, changes) {
    const row = await prisma.registerEntry.update({
      where: { id },
      data: toUpdateData(changes),
      include: withRelations,
    });
    return toEntry(row);
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
