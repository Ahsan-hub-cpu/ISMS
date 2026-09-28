import "server-only";

import type { Organization as PrismaOrganization, Site as PrismaSite } from "@prisma/client";

import { prisma } from "@/infrastructure/database/prisma";

import type { Organization, Site } from "../domain/entities";
import type { OrganizationRepository } from "../application/ports/organization-repository";

const toOrganization = (row: PrismaOrganization): Organization => ({
  id: row.id,
  name: row.name,
  shortName: row.shortName,
  createdAt: row.createdAt,
});

const toSite = (row: PrismaSite): Site => ({
  id: row.id,
  organizationId: row.organizationId,
  name: row.name,
  code: row.code,
  region: row.region,
  isActive: row.isActive,
});

export const prismaOrganizationRepository: OrganizationRepository = {
  async findPrimary() {
    const row = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
    return row ? toOrganization(row) : null;
  },

  async listSites(organizationId) {
    const rows = await prisma.site.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
    return rows.map(toSite);
  },

  async findSiteByCode(organizationId, code) {
    const row = await prisma.site.findUnique({
      where: { organizationId_code: { organizationId, code } },
    });
    return row ? toSite(row) : null;
  },

  async createSite(data) {
    const row = await prisma.site.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        code: data.code,
        region: data.region,
      },
    });
    return toSite(row);
  },
};
