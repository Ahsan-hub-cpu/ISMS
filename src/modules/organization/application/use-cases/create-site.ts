import type { AuditDraft } from "@/modules/audit";
import { ConflictError, NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { Site } from "../../domain/entities";
import type { OrganizationRepository } from "../ports/organization-repository";
import type { CreateSiteInput } from "../schemas";

interface Dependencies {
  readonly organization: OrganizationRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly organizationId: string;
  readonly input: CreateSiteInput;
}

export const createSite =
  ({ organization, audit }: Dependencies) =>
  async ({ actor, organizationId, input }: Command): Promise<Result<Site>> => {
    const primary = await organization.findPrimary();
    if (!primary || primary.id !== organizationId) {
      return failure(new NotFoundError("Organization", organizationId));
    }

    const existing = await organization.findSiteByCode(organizationId, input.code);
    if (existing) {
      return failure(new ConflictError(`A site with code '${input.code}' already exists.`));
    }

    const site = await organization.createSite({
      organizationId,
      name: input.name,
      code: input.code,
      region: input.region?.trim() ? input.region.trim() : null,
    });

    await audit({
      actor,
      action: "CREATE",
      entityType: "Site",
      entityId: site.id,
      summary: `Site ${site.code} (${site.name}) added`,
    });

    return success(site);
  };
