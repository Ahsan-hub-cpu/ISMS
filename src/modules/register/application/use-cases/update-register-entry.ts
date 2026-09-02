import type { AuditDraft } from "@/modules/audit";
import { NotFoundError, ValidationError } from "@/shared/core/errors";
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

    const applicability = changes.applicability ?? existing.applicability;
    const returningToScope =
      applicability === "APPLICABLE" && existing.applicability === "NOT_APPLICABLE";

    // A justification says why a control is excluded, so it is meaningless once
    // the control is back in scope. Dropping it stops a stale reason lingering
    // on the statement of applicability, and stops it satisfying the rule below
    // the next time someone tries to exclude the control.
    const justification = returningToScope
      ? null
      : changes.justification !== undefined
        ? changes.justification
        : existing.justification;

    // Excluding a control from scope must always be defensible, which is what an
    // auditor looks for in a statement of applicability.
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
      // An excluded control cannot claim implementation progress.
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

    return success(updated);
  };
