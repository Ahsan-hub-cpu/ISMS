/**
 * Domain entities are plain, framework-free shapes.
 * They never import Prisma, React or Next.js.
 */

export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly createdAt: Date;
}

export interface Site {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly code: string;
  readonly region: string | null;
  readonly isActive: boolean;
}

export interface OrganizationProfile {
  readonly organization: Organization;
  readonly sites: readonly Site[];
  readonly activeSiteCount: number;
}

export const countActiveSites = (sites: readonly Site[]): number =>
  sites.reduce((total, site) => (site.isActive ? total + 1 : total), 0);
