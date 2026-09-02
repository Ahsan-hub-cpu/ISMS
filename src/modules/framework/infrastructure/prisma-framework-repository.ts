import "server-only";

import type {
  Control as PrismaControl,
  ControlTheme as PrismaTheme,
  Framework as PrismaFramework,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/infrastructure/database/prisma";
import { paginate, toSkipTake } from "@/shared/core/pagination";

import {
  toControlTypes,
  toCybersecurityConcepts,
  toSecurityProperties,
} from "../domain/attributes";
import type { Control, ControlTheme, Framework } from "../domain/entities";
import type { FrameworkRepository } from "../application/ports/framework-repository";
import type { ControlQuery } from "../application/schemas";

const toFramework = (row: PrismaFramework): Framework => ({
  id: row.id,
  code: row.code,
  name: row.name,
  version: row.version,
  publisher: row.publisher,
  description: row.description,
  isActive: row.isActive,
});

const toTheme = (row: PrismaTheme): ControlTheme => ({
  id: row.id,
  frameworkId: row.frameworkId,
  code: row.code,
  name: row.name,
  description: row.description,
  sortOrder: row.sortOrder,
});

const toControl = (row: PrismaControl): Control => ({
  id: row.id,
  frameworkId: row.frameworkId,
  themeId: row.themeId,
  code: row.code,
  title: row.title,
  purpose: row.purpose,
  description: row.description,
  // The database stores plain strings; the domain vocabularies are applied here
  // so an unexpected value can never leak into the rest of the application.
  controlTypes: toControlTypes(row.controlTypes),
  securityProperties: toSecurityProperties(row.securityProperties),
  cybersecurityConcepts: toCybersecurityConcepts(row.cybersecurityConcepts),
  sortOrder: row.sortOrder,
});

const buildWhere = (frameworkId: string, query: ControlQuery): Prisma.ControlWhereInput => ({
  frameworkId,
  ...(query.themeCode ? { theme: { code: query.themeCode } } : {}),
  ...(query.controlType ? { controlTypes: { has: query.controlType } } : {}),
  ...(query.securityProperty ? { securityProperties: { has: query.securityProperty } } : {}),
  ...(query.cybersecurityConcept
    ? { cybersecurityConcepts: { has: query.cybersecurityConcept } }
    : {}),
  ...(query.search
    ? {
        OR: [
          { code: { contains: query.search, mode: "insensitive" } },
          { title: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
          { purpose: { contains: query.search, mode: "insensitive" } },
        ],
      }
    : {}),
});

export const prismaFrameworkRepository: FrameworkRepository = {
  async listFrameworks() {
    const rows = await prisma.framework.findMany({ orderBy: { name: "asc" } });
    return rows.map(toFramework);
  },

  async findFrameworkByCode(code) {
    const row = await prisma.framework.findUnique({ where: { code } });
    return row ? toFramework(row) : null;
  },

  async listThemeSummaries(frameworkId) {
    const rows = await prisma.controlTheme.findMany({
      where: { frameworkId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { controls: true } } },
    });

    return rows.map((row) => ({ ...toTheme(row), controlCount: row._count.controls }));
  },

  countControls(frameworkId) {
    return prisma.control.count({ where: { frameworkId } });
  },

  async searchControls(frameworkId, query) {
    const where = buildWhere(frameworkId, query);

    const [rows, total] = await Promise.all([
      prisma.control.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        ...toSkipTake(query),
      }),
      prisma.control.count({ where }),
    ]);

    return paginate(rows.map(toControl), total, query);
  },

  async findControlByCode(frameworkId, controlCode) {
    const row = await prisma.control.findUnique({
      where: { frameworkId_code: { frameworkId, code: controlCode } },
      include: { theme: true },
    });

    return row ? { ...toControl(row), theme: toTheme(row.theme) } : null;
  },

  async findAdjacentControls(frameworkId, sortOrder) {
    const [previous, next] = await Promise.all([
      prisma.control.findFirst({
        where: { frameworkId, sortOrder: { lt: sortOrder } },
        orderBy: { sortOrder: "desc" },
      }),
      prisma.control.findFirst({
        where: { frameworkId, sortOrder: { gt: sortOrder } },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return {
      previous: previous ? toControl(previous) : null,
      next: next ? toControl(next) : null,
    };
  },
};
