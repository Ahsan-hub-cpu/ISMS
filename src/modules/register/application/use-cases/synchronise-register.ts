import type { AuditDraft } from "@/modules/audit";
import { success, type Result } from "@/shared/core/result";

import type { RegisterRepository } from "../ports/register-repository";

interface Dependencies {
  readonly register: RegisterRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string } | null;
  readonly organizationId: string;
  readonly frameworkId: string;
}

/**
 * Brings the register in line with the catalogue by adding an entry for every
 * control that does not have one yet. Nothing is removed, so decisions already
 * recorded against a control are never lost.
 */
export const synchroniseRegister =
  ({ register, audit }: Dependencies) =>
  async ({ actor, organizationId, frameworkId }: Command): Promise<Result<{ added: number }>> => {
    const added = await register.createMissingEntries(organizationId, frameworkId);

    if (added > 0) {
      await audit({
        actor,
        action: "CREATE",
        entityType: "RegisterEntry",
        summary: `Added ${added} control${added === 1 ? "" : "s"} to the control register`,
      });
    }

    return success({ added });
  };
