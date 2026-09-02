import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/infrastructure/database/prisma";
import { paginate, toSkipTake } from "@/shared/core/pagination";

import type { Evidence } from "../domain/entities";
import type { EvidenceRepository } from "../application/ports/evidence-repository";
import type { EvidenceQuery, EvidenceTarget } from "../application/schemas";

const withRelations = {
  uploadedBy: { select: { fullName: true } },
  reviewedBy: { select: { fullName: true } },
  links: {
    include: {
      control: { select: { code: true } },
      gap: { select: { reference: true } },
      remediation: { select: { reference: true } },
    },
  },
} satisfies Prisma.EvidenceInclude;

type EvidenceRow = Prisma.EvidenceGetPayload<{ include: typeof withRelations }>;

const toEvidence = (row: EvidenceRow): Evidence => ({
  id: row.id,
  title: row.title,
  description: row.description,
  kind: row.kind,
  url: row.url,
  fileName: row.fileName,
  mimeType: row.mimeType,
  fileSize: row.fileSize,
  uploadedByName: row.uploadedBy?.fullName ?? null,
  reviewStatus: row.reviewStatus,
  reviewNote: row.reviewNote,
  reviewedByName: row.reviewedBy?.fullName ?? null,
  reviewedAt: row.reviewedAt,
  validUntil: row.validUntil,
  createdAt: row.createdAt,
  links: row.links.map((link) => ({
    id: link.id,
    controlId: link.controlId,
    controlCode: link.control?.code ?? null,
    assessmentItemId: link.assessmentItemId,
    gapId: link.gapId,
    gapReference: link.gap?.reference ?? null,
    remediationId: link.remediationId,
    remediationReference: link.remediation?.reference ?? null,
  })),
});

const toLinkData = (target: EvidenceTarget) => ({
  controlId: target.controlId ?? null,
  assessmentItemId: target.assessmentItemId ?? null,
  gapId: target.gapId ?? null,
  remediationId: target.remediationId ?? null,
});

const buildWhere = (organizationId: string, query: EvidenceQuery): Prisma.EvidenceWhereInput => {
  const linkFilter = {
    ...(query.controlId ? { controlId: query.controlId } : {}),
    ...(query.gapId ? { gapId: query.gapId } : {}),
    ...(query.remediationId ? { remediationId: query.remediationId } : {}),
    ...(query.assessmentItemId ? { assessmentItemId: query.assessmentItemId } : {}),
  };

  return {
    organizationId,
    ...(query.kind ? { kind: query.kind } : {}),
    ...(query.reviewStatus ? { reviewStatus: query.reviewStatus } : {}),
    ...(Object.keys(linkFilter).length > 0 ? { links: { some: linkFilter } } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
            { fileName: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
};

export const prismaEvidenceRepository: EvidenceRepository = {
  async create(data) {
    const row = await prisma.evidence.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        description: data.description,
        kind: data.kind,
        url: data.url,
        fileName: data.fileName,
        storedFileName: data.storedFileName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        uploadedById: data.uploadedById,
        validUntil: data.validUntil,
        links: { create: toLinkData(data.target) },
      },
      include: withRelations,
    });

    return toEvidence(row);
  },

  async list(organizationId, query) {
    const where = buildWhere(organizationId, query);

    const [rows, total] = await Promise.all([
      prisma.evidence.findMany({
        where,
        include: withRelations,
        orderBy: { createdAt: "desc" },
        ...toSkipTake(query),
      }),
      prisma.evidence.count({ where }),
    ]);

    return paginate(rows.map(toEvidence), total, query);
  },

  async findById(id) {
    const row = await prisma.evidence.findUnique({ where: { id }, include: withRelations });
    return row ? toEvidence(row) : null;
  },

  async storedFileNameOf(id) {
    const row = await prisma.evidence.findUnique({
      where: { id },
      select: { storedFileName: true },
    });
    return row?.storedFileName ?? null;
  },

  async addLink(evidenceId, target) {
    const row = await prisma.evidence.update({
      where: { id: evidenceId },
      data: { links: { create: toLinkData(target) } },
      include: withRelations,
    });

    return toEvidence(row);
  },

  async removeLink(linkId) {
    await prisma.evidenceLink.delete({ where: { id: linkId } });
  },

  async review(id, status, note, reviewerId) {
    const row = await prisma.evidence.update({
      where: { id },
      data: {
        reviewStatus: status,
        reviewNote: note,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      include: withRelations,
    });

    return toEvidence(row);
  },

  async remove(id) {
    await prisma.evidence.delete({ where: { id } });
  },

  async summarise(organizationId) {
    const [total, pending, accepted, rejected, expired] = await Promise.all([
      prisma.evidence.count({ where: { organizationId } }),
      prisma.evidence.count({ where: { organizationId, reviewStatus: "PENDING" } }),
      prisma.evidence.count({ where: { organizationId, reviewStatus: "ACCEPTED" } }),
      prisma.evidence.count({ where: { organizationId, reviewStatus: "REJECTED" } }),
      prisma.evidence.count({ where: { organizationId, validUntil: { lt: new Date() } } }),
    ]);

    return { total, pending, accepted, rejected, expired };
  },
};
