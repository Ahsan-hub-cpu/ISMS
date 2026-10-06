import type { AuditDraft } from "@/modules/audit";
import { notifyUsers, userIdsWithPermission } from "@/modules/notifications";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { RegisterEntry } from "../../domain/entities";
import type { RegisterRepository } from "../ports/register-repository";
import type { UpdateRegisterEntryInput } from "../schemas";

interface Dependencies {
  readonly register: RegisterRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly entryId: string;
  readonly changes: UpdateRegisterEntryInput;
}

export const updateRegisterEntry =
  ({ register, audit }: Dependencies) =>
  async ({ actor, entryId, changes }: Command): Promise<Result<RegisterEntry>> => {
    const existing = await register.findById(entryId);
    if (!existing) {
      return failure(new NotFoundError("Register entry", entryId));
    }

    if (existing.closureLocked) {
      return failure(
        new ConflictError(
          `${existing.controlCode} is locked because its gap was resolved. Reopen the gap if the control must change again.`,
        ),
      );
    }

    const applicability = changes.applicability ?? existing.applicability;
    const returningToScope =
      applicability === "APPLICABLE" && existing.applicability === "NOT_APPLICABLE";

    const justification = returningToScope
      ? null
      : changes.justification !== undefined
        ? changes.justification
        : existing.justification;

    if (applicability === "NOT_APPLICABLE" && !justification?.trim()) {
      return failure(
        new ValidationError("A justification is required when a control is not applicable.", [
          { field: "justification", message: "Explain why this control does not apply." },
        ]),
      );
    }

    const updated = await register.update(entryId, {
      ...changes,
      ...(returningToScope ? { justification: null } : {}),
      ...(applicability === "NOT_APPLICABLE" ? { implementationStatus: "NOT_IMPLEMENTED" } : {}),
    });

    await audit({
      actor,
      action: "UPDATE",
      entityType: "RegisterEntry",
      entityId: updated.id,
      summary:
        changes.applicability && changes.applicability !== existing.applicability
          ? `${updated.controlCode} marked ${applicability === "NOT_APPLICABLE" ? "not applicable" : "applicable"}${justification ? `: ${justification}` : ""}`
          : `Updated register entry for ${updated.controlCode} ${updated.controlTitle}`,
    });

    if (changes.ownerId && changes.ownerId !== existing.ownerId) {
      const drafts = [];
      if (updated.ownerId) {
        drafts.push({
          userId: updated.ownerId,
          title: "Control assigned to you",
          body: `${updated.controlCode} ${updated.controlTitle} is now yours to implement and evidence.`,
          href: "/register",
        });
      }

      const assessorIds = await userIdsWithPermission("assessments:conduct", {
        excludeUserId: actor.id,
      });
      for (const userId of assessorIds) {
        drafts.push({
          userId,
          title: "Register ready — start / continue assessment",
          body: `${actor.fullName} set ${updated.ownerName ?? "an owner"} on ${updated.controlCode}. Record findings in an assessment.`,
          href: "/assessments",
        });
      }

      await notifyUsers(drafts);
    }

    return success(updated);
  };
