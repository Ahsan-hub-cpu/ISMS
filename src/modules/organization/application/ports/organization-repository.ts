import type { Organization, Site } from "../../domain/entities";

/**
 * Port (interface) owned by the application layer.
 * The infrastructure layer provides the Prisma implementation, so use cases
 * stay testable and independent of the database.
 */
export interface OrganizationRepository {
  findPrimary(): Promise<Organization | null>;
  listSites(organizationId: string): Promise<Site[]>;
}
