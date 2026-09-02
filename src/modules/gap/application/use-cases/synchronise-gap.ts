import type { AuditDraft } from "@/modules/audit";
import type { ImplementationStatus } from "@/modules/register";

import { draftGapWording, isClosed } from "../../domain/entities";
import { calculateRisk } from "../../domain/risk";
import type { GapRepository } from "../ports/gap-repository";
import type { RemediationPlanner } from "../ports/remediation-planner";

interface Dependencies {
  readonly gaps: GapRepository;
  readonly planner: RemediationPlanner;
  readonly audit: (draft: AuditDraft) => Promise<void>;
  readonly implementationStatusFor: (
    organizationId: string,
    controlId: string,
  ) => Promise<ImplementationStatus | null>;
}

export interface FindingChanged {
  readonly actor: { id: string; email: string; fullName: string } | null;
  readonly organizationId: string;
  readonly assessmentId: string;
  readonly assessmentItemId: string;
  readonly controlId: string;
  readonly complianceStatus: string;
  readonly currentPractice: string | null;
}

const SHORTFALL_BY_STATUS: Record<string, "PARTIAL" | "NONE_IN_PLACE"> = {
  NON_COMPLIANT: "NONE_IN_PLACE",
  PARTIALLY_COMPLIANT: "PARTIAL",
};

/**
 * Keeps the gap register in step with an assessment finding. A shortfall raises
 * a gap and a remediation action automatically so nobody has to remember to.
 *
 * A compliant finding deliberately does NOT close the gap. It moves the gap to
 * AWAITING_REVIEW and its actions into review, leaving the decision to close
 * with an assessor (see `verifyGapClosure`).
 */
export const synchroniseGap =
  ({ gaps, planner, audit, implementationStatusFor }: Dependencies) =>
  async (finding: FindingChanged): Promise<void> => {
    const shortfall = SHORTFALL_BY_STATUS[finding.complianceStatus];
    const existing = await gaps.findByAssessmentItem(finding.assessmentItemId);

    if (!shortfall) {
      if (!existing || isClosed(existing.status) || existing.status === "AWAITING_REVIEW") return;

      await gaps.setStatus(existing.id, "AWAITING_REVIEW");
      await planner.onGapAwaitingReview(existing.id);
      await audit({
        actor: finding.actor,
        action: "UPDATE",
        entityType: "Gap",
        entityId: existing.id,
        summary: `${existing.reference} moved from ${existing.status} to AWAITING_REVIEW: the control was reassessed as compliant and now needs assessor verification`,
      });
      return;
    }

    const control = await gaps.findControlContext(finding.controlId);
    if (!control) return;

    const risk = calculateRisk({
      shortfall,
      securityProperties: control.securityProperties,
      controlTypes: control.controlTypes,
      implementationStatus: await implementationStatusFor(finding.organizationId, control.id),
    });

    const wording = draftGapWording({
      controlCode: control.code,
      controlTitle: control.title,
      purpose: control.purpose,
      currentPractice: finding.currentPractice,
      fullShortfall: shortfall === "NONE_IN_PLACE",
    });

    const gap = existing
      ? await gaps.refresh(existing.id, { ...wording, risk })
      : await gaps.create({
          assessmentId: finding.assessmentId,
          assessmentItemId: finding.assessmentItemId,
          controlId: control.id,
          reference: await gaps.nextReference(),
          ...wording,
          risk,
          identifiedById: finding.actor?.id ?? null,
        });

    // A gap that had been closed or signed off is exposed again by a new
    // shortfall, so it goes back into the working part of the lifecycle.
    if (existing && existing.status !== "OPEN" && existing.status !== "IN_PROGRESS") {
      await gaps.setStatus(existing.id, "IN_PROGRESS", {
        verifiedById: null,
        verifiedAt: null,
      });
      await audit({
        actor: finding.actor,
        action: "UPDATE",
        entityType: "Gap",
        entityId: existing.id,
        summary: `${existing.reference} reopened from ${existing.status} to IN_PROGRESS after a new shortfall was recorded`,
      });
    }

    await audit({
      actor: finding.actor,
      action: existing ? "UPDATE" : "CREATE",
      entityType: "Gap",
      entityId: gap.id,
      summary: existing
        ? `${gap.reference} risk recalculated as ${risk.rating} (${risk.score}/${risk.maximumScore}, ${risk.modelVersion})`
        : `${gap.reference} identified for ${control.code} with ${risk.rating.toLowerCase()} risk (${risk.score}/${risk.maximumScore}, ${risk.modelVersion})`,
    });

    await planner.ensureActionForGap({
      actor: finding.actor,
      organizationId: finding.organizationId,
      gapId: gap.id,
      gapReference: gap.reference,
      controlId: control.id,
      controlCode: control.code,
      controlTitle: control.title,
      recommendation: wording.recommendation,
      riskRating: risk.rating,
    });
  };
