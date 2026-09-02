import { NotFoundError } from "@/shared/core/errors";

import { getOrganizationProfile } from "./application/use-cases/get-organization-profile";
import { prismaOrganizationRepository } from "./infrastructure/prisma-organization-repository";

/**
 * Composition root for the organization module: the only place where a use case
 * is wired to a concrete implementation of its port.
 */
export const organizationService = {
  getProfile: getOrganizationProfile(prismaOrganizationRepository),

  /**
   * The platform serves a single health district, so every module resolves its
   * tenant through here rather than passing an id down from the UI.
   */
  currentId: async (): Promise<string> => {
    const organization = await prismaOrganizationRepository.findPrimary();
    if (!organization) {
      throw new NotFoundError("Organization", "primary");
    }
    return organization.id;
  },

  listSites: (organizationId: string) => prismaOrganizationRepository.listSites(organizationId),
};

export type { Organization, OrganizationProfile, Site } from "./domain/entities";
