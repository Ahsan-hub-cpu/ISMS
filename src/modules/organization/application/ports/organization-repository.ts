import type { Organization, Site } from "../../domain/entities";

export interface NewSite {
  readonly organizationId: string;
  readonly name: string;
  readonly code: string;
  readonly region: string | null;
}

/**
 * Port (interface) owned by the application layer.
 * The infrastructure layer provides the Prisma implementation, so use cases
 * stay testable and independent of the database.
 */
export interface OrganizationRepository {
  findPrimary(): Promise<Organization | null>;
  listSites(organizationId: string): Promise<Site[]>;
  findSiteByCode(organizationId: string, code: string): Promise<Site | null>;
  createSite(data: NewSite): Promise<Site>;
}
