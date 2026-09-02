import { NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import { countActiveSites, type OrganizationProfile } from "../../domain/entities";
import type { OrganizationRepository } from "../ports/organization-repository";

/**
 * Use case: load the organization the ISMS belongs to, together with its sites.
 * Business rules live here; the route handler only calls this function.
 */
export const getOrganizationProfile =
  (repository: OrganizationRepository) =>
  async (): Promise<Result<OrganizationProfile>> => {
    const organization = await repository.findPrimary();

    if (!organization) {
      return failure(new NotFoundError("Organization"));
    }

    const sites = await repository.listSites(organization.id);

    return success({
      organization,
      sites,
      activeSiteCount: countActiveSites(sites),
    });
  };
