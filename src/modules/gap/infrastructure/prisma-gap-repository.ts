import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/infrastructure/database/prisma";
import { paginate, toSkipTake } from "@/shared/core/pagination";

import { RISK_RATINGS, type RiskFactor, type RiskRating } from "../domain/risk";
import { isClosed, type Gap } from "../domain/entities";
import type { GapRepository } from "../application/ports/gap-repository";
import type { GapQuery } from "../application/schemas";

const OUTSTANDING = ["OPEN", "IN_PROGRESS", "AWAITING_REVIEW"] as const;

const withRelations = {
  control: { include: { theme: true } },
  assessment: { select: { reference: true } },
  identifiedBy: { select: { fullName: true } },
  verifiedBy: { select: { fullName: true } },
  _count: { select: { remediations: { where: { status: { notIn: ["COMPLETED", "CANCELLED"] } } } } },
} satisfies Prisma.GapInclude;

type GapRow = Prisma.GapGetPayload<{ include: typeof withRelations }>;

/** Risk factors are stored as JSON, so they are read back defensively. */
const toRiskFactors = (value: Prisma.JsonValue): RiskFactor[] =>
  Array.isArray(value) ? (value as unknown as RiskFactor[]) : [];

const toGap = (row: GapRow): Gap => ({
  id: row.id,
  reference: row.reference,
  assessmentId: row.assessmentId,
  assessmentReference: row.assessment.reference,
  assessmentItemId: row.assessmentItemId,
  controlId: row.controlId,
  controlCode: row.control.code,
  controlTitle: row.control.title,
  themeCode: row.control.theme.code,
  summary: row.summary,
  description: row.description,
  recommendation: row.recommendation,
  generatedDescription: row.generatedDescription,
  generatedRecommendation: row.generatedRecommendation,
  descriptionEditedAt: row.descriptionEditedAt,
  recommendationEditedAt: row.recommendationEditedAt,
  riskRating: row.riskRating,
  riskScore: row.riskScore,
  riskMaximumScore: row.riskMaximumScore,
  riskModelVersion: row.riskModelVersion,
  riskFactors: toRiskFactors(row.riskFactors),
  riskRatingOverridden: row.riskRatingOverridden,
  status: row.status,
  identifiedByName: row.identifiedBy?.fullName ?? null,
  identifiedAt: row.identifiedAt,
  verifiedByName: row.verifiedBy?.fullName ?? null,
  verifiedAt: row.verifiedAt,
  resolvedAt: row.resolvedAt,
  openActions: row._count.remediations,
});

const buildWhere = (query: GapQuery): Prisma.GapWhereInput => ({
  ...(query.status ? { status: query.status } : {}),
  ...(query.riskRating ? { riskRating: query.riskRating } : {}),
  ...(query.assessmentId ? { assessmentId: query.assessmentId } : {}),
  ...(query.outstandingOnly ? { status: { in: [...OUTSTANDING] } } : {}),
  ...(query.search
    ? {
        OR: [
          { reference: { contains: query.search, mode: "insensitive" } },
          { summary: { contains: query.search, mode: "insensitive" } },
          { control: { code: { contains: query.search, mode: "insensitive" } } },
          { control: { title: { contains: query.search, mode: "insensitive" } } },
        ],
      }
    : {}),
});

export const prismaGapRepository: GapRepository = {
  async findControlContext(controlId) {
    const row = await prisma.control.findUnique({
      where: { id: controlId },
      include: { theme: { select: { code: true } } },
    });

    if (!row) return null;

    return {
      id: row.id,
      code: row.code,
      title: row.title,
      purpose: row.purpose,
      themeCode: row.theme.code,
      securityProperties: row.securityProperties,
      controlTypes: row.controlTypes,
      cybersecurityConcepts: row.cybersecurityConcepts,
    };
  },

  async findRiskContext(gapId) {
    const row = await prisma.gap.findUnique({
      where: { id: gapId },
      select: {
        assessmentItem: { select: { status: true } },
        control: { include: { theme: { select: { code: true } } } },
      },
    });

    if (!row) return null;

    return {
      complianceStatus: row.assessmentItem.status,
      control: {
        id: row.control.id,
        code: row.control.code,
        title: row.control.title,
        purpose: row.control.purpose,
        themeCode: row.control.theme.code,
        securityProperties: row.control.securityProperties,
        controlTypes: row.control.controlTypes,
        cybersecurityConcepts: row.control.cybersecurityConcepts,
      },
    };
  },

  async findByAssessmentItem(assessmentItemId) {
    const row = await prisma.gap.findUnique({
      where: { assessmentItemId },
      select: { id: true, reference: true, status: true, riskRating: true },
    });

    return row ?? null;
  },

  async nextReference() {
    const count = await prisma.gap.count();
    return `GAP-${String(count + 1).padStart(4, "0")}`;
  },

  async create(data) {
    return prisma.gap.create({
      data: {
        assessmentId: data.assessmentId,
        assessmentItemId: data.assessmentItemId,
        controlId: data.controlId,
        reference: data.reference,
        summary: data.summary,
        description: data.description,
        recommendation: data.recommendation,
        generatedDescription: data.description,
        generatedRecommendation: data.recommendation,
        riskRating: data.risk.rating,
        riskScore: data.risk.score,
        riskMaximumScore: data.risk.maximumScore,
        riskModelVersion: data.risk.modelVersion,
        riskFactors: data.risk.factors as unknown as Prisma.InputJsonValue,
        identifiedById: data.identifiedById,
      },
      select: { id: true, reference: true, status: true, riskRating: true },
    });
  },

  async refresh(id, data) {
    const current = await prisma.gap.findUniqueOrThrow({
      where: { id },
      select: { descriptionEditedAt: true, recommendationEditedAt: true, riskRatingOverridden: true },
    });

    return prisma.gap.update({
      where: { id },
      data: {
        summary: data.summary,
        generatedDescription: data.description,
        generatedRecommendation: data.recommendation,
        // Wording an assessor has taken ownership of is never overwritten by a
        // later re-run; only the untouched draft is refreshed.
        ...(current.descriptionEditedAt ? {} : { description: data.description }),
        ...(current.recommendationEditedAt ? {} : { recommendation: data.recommendation }),
        ...(current.riskRatingOverridden ? {} : { riskRating: data.risk.rating }),
        riskScore: data.risk.score,
        riskMaximumScore: data.risk.maximumScore,
        riskModelVersion: data.risk.modelVersion,
        riskFactors: data.risk.factors as unknown as Prisma.InputJsonValue,
      },
      select: { id: true, reference: true, status: true, riskRating: true },
    });
  },

  async setStatus(id, status, options) {
    await prisma.gap.update({
      where: { id },
      data: {
        status,
        resolvedAt: options?.resolvedAt ?? (isClosed(status) ? new Date() : null),
        ...(options?.verifiedById !== undefined ? { verifiedById: options.verifiedById } : {}),
        ...(options?.verifiedAt !== undefined ? { verifiedAt: options.verifiedAt } : {}),
      },
    });
  },

  async closureContext(id) {
    const row = await prisma.gap.findUnique({
      where: { id },
      select: {
        status: true,
        assessmentItem: { select: { status: true } },
        _count: {
          select: {
            remediations: { where: { status: { notIn: ["COMPLETED", "CANCELLED"] } } },
          },
        },
      },
    });

    if (!row) return null;

    // Evidence attached to the gap itself or to any of its remediation actions
    // counts towards verification.
    const evidenceWhere: Prisma.EvidenceLinkWhereInput = {
      OR: [{ gapId: id }, { remediation: { gapId: id } }],
    };

    const [pendingEvidence, acceptedEvidence] = await Promise.all([
      prisma.evidenceLink.count({
        where: { ...evidenceWhere, evidence: { reviewStatus: "PENDING" } },
      }),
      prisma.evidenceLink.count({
        where: { ...evidenceWhere, evidence: { reviewStatus: "ACCEPTED" } },
      }),
    ]);

    return {
      status: row.status,
      openActions: row._count.remediations,
      pendingEvidence,
      acceptedEvidence,
      reassessedCompliant: row.assessmentItem.status === "COMPLIANT",
    };
  },

  async list(query) {
    const where = buildWhere(query);

    const [rows, total] = await Promise.all([
      prisma.gap.findMany({
        where,
        include: withRelations,
        orderBy: [{ status: "asc" }, { identifiedAt: "desc" }],
        ...toSkipTake(query),
      }),
      prisma.gap.count({ where }),
    ]);

    return paginate(rows.map(toGap), total, query);
  },

  async findById(id) {
    const row = await prisma.gap.findUnique({ where: { id }, include: withRelations });
    return row ? toGap(row) : null;
  },

  async update(id, changes, actorId) {
    const now = new Date();

    const row = await prisma.gap.update({
      where: { id },
      data: {
        ...(changes.description !== undefined
          ? { description: changes.description, descriptionEditedAt: now }
          : {}),
        ...(changes.recommendation !== undefined
          ? { recommendation: changes.recommendation, recommendationEditedAt: now }
          : {}),
        ...(changes.riskRating !== undefined
          ? { riskRating: changes.riskRating, riskRatingOverridden: true }
          : {}),
        ...(changes.status !== undefined
          ? {
              status: changes.status,
              resolvedAt: isClosed(changes.status) ? now : null,
              verifiedById: changes.status === "RESOLVED" ? actorId : null,
              verifiedAt: changes.status === "RESOLVED" ? now : null,
            }
          : {}),
      },
      include: withRelations,
    });

    return toGap(row);
  },

  async summarise() {
    const [byRiskRows, total, open, awaitingReview, resolved, accepted] = await Promise.all([
      prisma.gap.groupBy({
        by: ["riskRating"],
        where: { status: { in: [...OUTSTANDING] } },
        _count: { _all: true },
      }),
      prisma.gap.count(),
      prisma.gap.count({ where: { status: { in: [...OUTSTANDING] } } }),
      prisma.gap.count({ where: { status: "AWAITING_REVIEW" } }),
      prisma.gap.count({ where: { status: "RESOLVED" } }),
      prisma.gap.count({ where: { status: "RISK_ACCEPTED" } }),
    ]);

    const byRisk = Object.fromEntries(
      RISK_RATINGS.map((rating) => [
        rating,
        byRiskRows.find((row) => row.riskRating === rating)?._count._all ?? 0,
      ]),
    ) as Record<RiskRating, number>;

    return { total, open, awaitingReview, resolved, accepted, byRisk };
  },
};
