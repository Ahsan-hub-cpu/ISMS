import "server-only";

import { prisma } from "@/infrastructure/database/prisma";

import type { ResolutionPropagator } from "../application/ports/resolution-propagator";

export const prismaResolutionPropagator: ResolutionPropagator = {
  async markFindingCompliant({ assessmentItemId, actorId, gapReference }) {
    const existing = await prisma.assessmentItem.findUnique({
      where: { id: assessmentItemId },
      select: { status: true, rationale: true },
    });
    if (!existing) return;

    const note = `Marked Compliant automatically when ${gapReference} was resolved.`;
    const rationale =
      existing.status === "COMPLIANT" && existing.rationale?.includes(gapReference)
        ? existing.rationale
        : [existing.rationale?.trim(), note].filter(Boolean).join("\n");

    await prisma.assessmentItem.update({
      where: { id: assessmentItemId },
      data: {
        status: "COMPLIANT",
        rationale,
        ...(actorId ? { assessedById: actorId } : {}),
        assessedAt: new Date(),
      },
    });
  },

  async markRegisterImplemented({ assessmentId, controlId, gapReference }) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { organizationId: true },
    });
    if (!assessment) return;

    const entry = await prisma.registerEntry.findUnique({
      where: {
        organizationId_controlId: {
          organizationId: assessment.organizationId,
          controlId,
        },
      },
      select: { id: true, applicability: true, implementationNotes: true },
    });
    if (!entry || entry.applicability !== "APPLICABLE") return;

    const note = `Marked Implemented automatically when ${gapReference} was resolved.`;
    const implementationNotes =
      entry.implementationNotes?.includes(gapReference)
        ? entry.implementationNotes
        : [entry.implementationNotes?.trim(), note].filter(Boolean).join("\n");

    await prisma.registerEntry.update({
      where: { id: entry.id },
      data: {
        implementationStatus: "IMPLEMENTED",
        implementationNotes,
      },
    });
  },
};
