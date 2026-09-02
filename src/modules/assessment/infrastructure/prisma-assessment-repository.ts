import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/infrastructure/database/prisma";
import { paginate, toSkipTake } from "@/shared/core/pagination";

import {
  COMPLIANCE_STATUSES,
  summariseProgress,
  type Assessment,
  type AssessmentItem,
  type ComplianceStatus,
} from "../domain/entities";
import type { AssessmentRepository } from "../application/ports/assessment-repository";

const assessmentRelations = {
  framework: { select: { code: true, name: true } },
  leadAssessor: { select: { fullName: true } },
  approvedBy: { select: { fullName: true } },
} satisfies Prisma.AssessmentInclude;

type AssessmentRow = Prisma.AssessmentGetPayload<{ include: typeof assessmentRelations }>;

const itemRelations = {
  control: { include: { theme: { select: { code: true, name: true } } } },
  assessedBy: { select: { fullName: true } },
  gap: { select: { reference: true, riskRating: true } },
  _count: { select: { evidenceLinks: true } },
} satisfies Prisma.AssessmentItemInclude;

type ItemRow = Prisma.AssessmentItemGetPayload<{ include: typeof itemRelations }>;

const toItem = (row: ItemRow): AssessmentItem => ({
  id: row.id,
  assessmentId: row.assessmentId,
  controlId: row.controlId,
  controlCode: row.control.code,
  controlTitle: row.control.title,
  controlPurpose: row.control.purpose,
  themeCode: row.control.theme.code,
  themeName: row.control.theme.name,
  status: row.status,
  currentPractice: row.currentPractice,
  rationale: row.rationale,
  assessedByName: row.assessedBy?.fullName ?? null,
  assessedAt: row.assessedAt,
  gapReference: row.gap?.reference ?? null,
  gapRiskRating: row.gap?.riskRating ?? null,
  evidenceCount: row._count.evidenceLinks,
});

const progressFor = async (assessmentId: string) => {
  const grouped = await prisma.assessmentItem.groupBy({
    by: ["status"],
    where: { assessmentId },
    _count: { _all: true },
  });

  const byStatus = Object.fromEntries(
    COMPLIANCE_STATUSES.map((status) => [
      status,
      grouped.find((group) => group.status === status)?._count._all ?? 0,
    ]),
  ) as Record<ComplianceStatus, number>;

  return summariseProgress(byStatus);
};

const toAssessment = async (row: AssessmentRow): Promise<Assessment> => ({
  id: row.id,
  reference: row.reference,
  title: row.title,
  scope: row.scope,
  status: row.status,
  frameworkId: row.frameworkId,
  frameworkCode: row.framework.code,
  frameworkName: row.framework.name,
  leadAssessorId: row.leadAssessorId,
  leadAssessorName: row.leadAssessor.fullName,
  approvedByName: row.approvedBy?.fullName ?? null,
  startedAt: row.startedAt,
  submittedAt: row.submittedAt,
  approvedAt: row.approvedAt,
  progress: await progressFor(row.id),
});

export const prismaAssessmentRepository: AssessmentRepository = {
  async nextReference(organizationId) {
    const year = new Date().getFullYear();
    const count = await prisma.assessment.count({
      where: { organizationId, reference: { startsWith: `ASM-${year}-` } },
    });
    return `ASM-${year}-${String(count + 1).padStart(3, "0")}`;
  },

  async create(data, controlIds) {
    const row = await prisma.assessment.create({
      data: {
        organizationId: data.organizationId,
        frameworkId: data.frameworkId,
        reference: data.reference,
        title: data.title,
        scope: data.scope,
        leadAssessorId: data.leadAssessorId,
        items: { createMany: { data: controlIds.map((controlId) => ({ controlId })) } },
      },
      include: assessmentRelations,
    });

    return toAssessment(row);
  },

  async list(organizationId, query) {
    const where: Prisma.AssessmentWhereInput = {
      organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { reference: { contains: query.search, mode: "insensitive" } },
              { title: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        include: assessmentRelations,
        orderBy: { startedAt: "desc" },
        ...toSkipTake(query),
      }),
      prisma.assessment.count({ where }),
    ]);

    return paginate(await Promise.all(rows.map(toAssessment)), total, query);
  },

  async findById(id) {
    const row = await prisma.assessment.findUnique({ where: { id }, include: assessmentRelations });
    return row ? toAssessment(row) : null;
  },

  async listItems(assessmentId, query) {
    const where: Prisma.AssessmentItemWhereInput = {
      assessmentId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.pendingOnly ? { status: "NOT_ASSESSED" } : {}),
      ...(query.themeCode || query.search
        ? {
            control: {
              ...(query.themeCode ? { theme: { code: query.themeCode } } : {}),
              ...(query.search
                ? {
                    OR: [
                      { code: { contains: query.search, mode: "insensitive" } },
                      { title: { contains: query.search, mode: "insensitive" } },
                    ],
                  }
                : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.assessmentItem.findMany({
        where,
        include: itemRelations,
        orderBy: { control: { sortOrder: "asc" } },
        ...toSkipTake(query),
      }),
      prisma.assessmentItem.count({ where }),
    ]);

    return paginate(rows.map(toItem), total, query);
  },

  async findItem(itemId) {
    const row = await prisma.assessmentItem.findUnique({
      where: { id: itemId },
      include: { ...itemRelations, assessment: { select: { status: true } } },
    });

    if (!row) return null;

    return { ...toItem(row), assessmentStatus: row.assessment.status };
  },

  async recordFinding(itemId, input, assessorId) {
    const row = await prisma.assessmentItem.update({
      where: { id: itemId },
      data: {
        status: input.status,
        currentPractice: input.currentPractice?.trim() || null,
        rationale: input.rationale?.trim() || null,
        assessedById: assessorId,
        assessedAt: new Date(),
      },
      include: itemRelations,
    });

    // The first recorded finding moves the assessment out of draft.
    await prisma.assessment.updateMany({
      where: { id: row.assessmentId, status: "DRAFT" },
      data: { status: "IN_PROGRESS" },
    });

    return toItem(row);
  },

  async setStatus(id, status, actorId) {
    const row = await prisma.assessment.update({
      where: { id },
      data: {
        status,
        ...(status === "SUBMITTED" ? { submittedAt: new Date() } : {}),
        ...(status === "APPROVED" ? { approvedAt: new Date(), approvedById: actorId } : {}),
      },
      include: assessmentRelations,
    });

    return toAssessment(row);
  },

  countUnassessed(assessmentId) {
    return prisma.assessmentItem.count({ where: { assessmentId, status: "NOT_ASSESSED" } });
  },
};
