import type { AuditDraft } from "@/modules/audit";
import { ConflictError, NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import { canTransition, closureBlockers, GAP_STATUS_LABELS, type Gap } from "../../domain/entities";
import type { GapRepository } from "../ports/gap-repository";
import type { UpdateGapInput } from "../schemas";

interface Dependencies {
  readonly gaps: GapRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly gapId: string;
  readonly changes: UpdateGapInput;
}

export const updateGap =
  ({ gaps, audit }: Dependencies) =>
  async ({ actor, gapId, changes }: Command): Promise<Result<Gap>> => {
    const existing = await gaps.findById(gapId);
    if (!existing) {
      return failure(new NotFoundError("Gap", gapId));
    }

    if (changes.status && changes.status !== existing.status) {
      if (!canTransition(existing.status, changes.status)) {
        return failure(
          new ConflictError(
            `A gap cannot move from ${GAP_STATUS_LABELS[existing.status]} to ${GAP_STATUS_LABELS[changes.status]}.`,
          ),
        );
      }

      // Closing a gap while work or verification is outstanding would hide real
      // exposure, so the domain rules are checked server-side on every request.
      if (changes.status === "RESOLVED") {
        const context = await gaps.closureContext(gapId);
        if (!context) return failure(new NotFoundError("Gap", gapId));

        const blockers = closureBlockers(context);
        if (blockers.length > 0) {
          return failure(new ConflictError(blockers.join(" ")));
        }
      }
    }

    const updated = await gaps.update(gapId, changes, actor.id);

    if (changes.status && changes.status !== existing.status) {
      await audit({
        actor,
        action: changes.status === "RESOLVED" ? "VERIFY" : "UPDATE",
        entityType: "Gap",
        entityId: gapId,
        summary:
          changes.status === "RESOLVED"
            ? `${existing.reference} verified and closed by ${actor.fullName}`
            : `${existing.reference} moved from ${existing.status} to ${changes.status}`,
      });
    }

    if (changes.riskRating && changes.riskRating !== existing.riskRating) {
      await audit({
        actor,
        action: "UPDATE",
        entityType: "Gap",
        entityId: gapId,
        summary: `${existing.reference} risk rating overridden from ${existing.riskRating} to ${changes.riskRating} (calculated score ${existing.riskScore}/${existing.riskMaximumScore})`,
      });
    }

    if (changes.description !== undefined || changes.recommendation !== undefined) {
      const edited = [
        changes.description !== undefined ? "description" : null,
        changes.recommendation !== undefined ? "recommendation" : null,
      ].filter(Boolean);

      await audit({
        actor,
        action: "UPDATE",
        entityType: "Gap",
        entityId: gapId,
        summary: `${existing.reference} ${edited.join(" and ")} confirmed by ${actor.fullName}`,
      });
    }

    return success(updated);
  };
