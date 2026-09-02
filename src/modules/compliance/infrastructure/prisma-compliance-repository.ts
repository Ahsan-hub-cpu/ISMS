import "server-only";

import { COMPLIANCE_STATUSES, type ComplianceStatus } from "@/modules/assessment";
import { RISK_RATINGS, type RiskRating } from "@/modules/gap";
import { prisma } from "@/infrastructure/database/prisma";

import { emptyStatusCounts } from "@/modules/assessment/domain/scoring";

import {
  compliancePercentOf,
  scoreCompliance,
  type ComplianceOverview,
  type ThemeBreakdown,
  type TrendPoint,
} from "../domain/entities";

const OUTSTANDING_GAPS = ["OPEN", "IN_PROGRESS", "AWAITING_REVIEW"] as const;

const buildThemeBreakdown = async (assessmentId: string): Promise<ThemeBreakdown[]> => {
  const items = await prisma.assessmentItem.findMany({
    where: { assessmentId },
    select: {
      status: true,
      control: { select: { theme: { select: { code: true, name: true, sortOrder: true } } } },
      gap: { select: { status: true } },
    },
  });

  const themes = new Map<
    string,
    { name: string; sortOrder: number; byStatus: Record<ComplianceStatus, number>; openGaps: number }
  >();

  for (const item of items) {
    const { code, name, sortOrder } = item.control.theme;
    const bucket =
      themes.get(code) ?? { name, sortOrder, byStatus: emptyStatusCounts(), openGaps: 0 };

    bucket.byStatus[item.status] += 1;
    if (item.gap && (OUTSTANDING_GAPS as readonly string[]).includes(item.gap.status)) {
      bucket.openGaps += 1;
    }

    themes.set(code, bucket);
  }

  return [...themes.entries()]
    .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
    .map(([themeCode, bucket]) => ({
      themeCode,
      themeName: bucket.name,
      total: COMPLIANCE_STATUSES.reduce((sum, status) => sum + bucket.byStatus[status], 0),
      byStatus: bucket.byStatus,
      compliancePercent: compliancePercentOf(bucket.byStatus),
      openGaps: bucket.openGaps,
    }));
};

const buildTrend = async (organizationId: string): Promise<TrendPoint[]> => {
  const assessments = await prisma.assessment.findMany({
    where: { organizationId },
    orderBy: { startedAt: "asc" },
    select: { reference: true, items: { select: { status: true } } },
  });

  return assessments.map((assessment) => {
    const byStatus = emptyStatusCounts();
    for (const item of assessment.items) byStatus[item.status] += 1;

    return { label: assessment.reference, compliancePercent: compliancePercentOf(byStatus) };
  });
};

export const prismaComplianceRepository = {
  async overview(organizationId: string, assessmentId?: string): Promise<ComplianceOverview> {
    const assessment = await prisma.assessment.findFirst({
      where: { organizationId, ...(assessmentId ? { id: assessmentId } : {}) },
      orderBy: { startedAt: "desc" },
      select: { id: true, reference: true, title: true, status: true, startedAt: true },
    });

    const gapRows = await prisma.gap.groupBy({
      by: ["riskRating"],
      where: { status: { in: [...OUTSTANDING_GAPS] } },
      _count: { _all: true },
    });

    const gapsByRisk = Object.fromEntries(
      RISK_RATINGS.map((rating) => [
        rating,
        gapRows.find((row) => row.riskRating === rating)?._count._all ?? 0,
      ]),
    ) as Record<RiskRating, number>;

    if (!assessment) {
      return { assessment: null, themes: [], gapsByRisk, trend: [] };
    }

    const [themes, trend, grouped] = await Promise.all([
      buildThemeBreakdown(assessment.id),
      buildTrend(organizationId),
      prisma.assessmentItem.groupBy({
        by: ["status"],
        where: { assessmentId: assessment.id },
        _count: { _all: true },
      }),
    ]);

    const byStatus = emptyStatusCounts();
    for (const group of grouped) byStatus[group.status] = group._count._all;

    const score = scoreCompliance(byStatus);

    return {
      assessment: {
        id: assessment.id,
        reference: assessment.reference,
        title: assessment.title,
        status: assessment.status,
        startedAt: assessment.startedAt,
        compliancePercent: score.compliancePercent,
        completionPercent: score.completionPercent,
        byStatus,
      },
      themes,
      gapsByRisk,
      trend,
    };
  },
};
