/**
 * SEED POLICY — reference data only.
 *
 * This script writes the stable records an empty installation needs before
 * anyone can log in: the organisation, its sites, one demonstration account per
 * role, and the framework catalogue. It deliberately writes no operational
 * data. Assessments, findings, gaps, evidence, remediation actions and audit
 * records are created only by people using the application, so what the reports
 * show is always the result of real workflow rather than fixtures.
 *
 * Every write is an upsert keyed on a stable natural key (organisation id, site
 * code, user email, framework code, control code), so `npm run db:seed` can be
 * run any number of times without creating duplicates. Existing password
 * hashes are left alone on re-run, so a changed password is not reset.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient, type UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface CatalogueControl {
  code: string;
  title: string;
  purpose: string;
  description: string;
  controlTypes: string[];
  securityProperties: string[];
  cybersecurityConcepts: string[];
}

interface CatalogueTheme {
  code: string;
  name: string;
  description: string;
  controls: CatalogueControl[];
}

interface CatalogueFile {
  code: string;
  name: string;
  version: string;
  publisher: string;
  description: string;
  themes: CatalogueTheme[];
}

const CATALOGUE_FILES = ["iso-27001-2022-annex-a.json"];

/** "A.5.10" must sort after "A.5.2", so the numeric parts drive the order. */
const controlSortOrder = (code: string): number => {
  const [theme = "0", index = "0"] = code.replace(/^A\./, "").split(".");
  return Number(theme) * 1000 + Number(index);
};

const readCatalogue = async (fileName: string): Promise<CatalogueFile> => {
  const filePath = path.join(import.meta.dirname, "data", fileName);
  return JSON.parse(await readFile(filePath, "utf8")) as CatalogueFile;
};

/**
 * The catalogue is loaded from a versioned JSON file rather than being written
 * inline, so the framework data has a single reviewable source of truth and can
 * be re-imported without changing code.
 */
async function seedCatalogue(fileName: string) {
  const catalogue = await readCatalogue(fileName);

  const framework = await prisma.framework.upsert({
    where: { code: catalogue.code },
    update: {
      name: catalogue.name,
      version: catalogue.version,
      publisher: catalogue.publisher,
      description: catalogue.description,
    },
    create: {
      code: catalogue.code,
      name: catalogue.name,
      version: catalogue.version,
      publisher: catalogue.publisher,
      description: catalogue.description,
    },
  });

  let controlCount = 0;

  for (const [themeIndex, theme] of catalogue.themes.entries()) {
    const storedTheme = await prisma.controlTheme.upsert({
      where: { frameworkId_code: { frameworkId: framework.id, code: theme.code } },
      update: { name: theme.name, description: theme.description, sortOrder: themeIndex },
      create: {
        frameworkId: framework.id,
        code: theme.code,
        name: theme.name,
        description: theme.description,
        sortOrder: themeIndex,
      },
    });

    for (const control of theme.controls) {
      const payload = {
        themeId: storedTheme.id,
        title: control.title,
        purpose: control.purpose,
        description: control.description,
        controlTypes: control.controlTypes,
        securityProperties: control.securityProperties,
        cybersecurityConcepts: control.cybersecurityConcepts,
        sortOrder: controlSortOrder(control.code),
      };

      await prisma.control.upsert({
        where: { frameworkId_code: { frameworkId: framework.id, code: control.code } },
        update: payload,
        create: { frameworkId: framework.id, code: control.code, ...payload },
      });

      controlCount += 1;
    }
  }

  return { name: framework.name, themes: catalogue.themes.length, controls: controlCount };
}

const ORGANIZATION = {
  name: "Northern Rivers Local Health District",
  shortName: "NRLHD",
};

const SITES = [
  { code: "WMD", name: "Westmead Hospital", region: "Parramatta" },
  { code: "BLK", name: "Blacktown Hospital", region: "Blacktown" },
  { code: "CMB", name: "Cumberland Hospital", region: "Parramatta" },
  { code: "MTD", name: "Mount Druitt Hospital", region: "Blacktown" },
  { code: "AUB", name: "Auburn Hospital", region: "Cumberland" },
];

/** Demonstration accounts, one per role. Passwords are for local use only. */
const USERS: {
  email: string;
  fullName: string;
  jobTitle: string;
  role: UserRole;
  password: string;
  siteCode?: string;
}[] = [
  {
    email: "admin@nrlhd.health.nsw.gov.au",
    fullName: "Amelia Ward",
    jobTitle: "ISMS Administrator",
    role: "ADMINISTRATOR",
    password: "Administrator1",
  },
  {
    email: "assessor@nrlhd.health.nsw.gov.au",
    fullName: "Daniel Ortiz",
    jobTitle: "Compliance Officer",
    role: "ASSESSOR",
    password: "Assessor12345",
  },
  {
    email: "owner@nrlhd.health.nsw.gov.au",
    fullName: "Priya Nair",
    jobTitle: "Clinical Systems Manager",
    role: "CONTROL_OWNER",
    password: "Controlowner1",
    siteCode: "WMD",
  },
  {
    email: "viewer@nrlhd.health.nsw.gov.au",
    fullName: "Grace Lim",
    jobTitle: "Executive Director",
    role: "VIEWER",
    password: "Viewer1234567",
  },
];

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "org-nrlhd" },
    update: ORGANIZATION,
    create: { id: "org-nrlhd", ...ORGANIZATION },
  });

  for (const site of SITES) {
    await prisma.site.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: site.code } },
      update: { name: site.name, region: site.region },
      create: { ...site, organizationId: organization.id },
    });
  }

  for (const user of USERS) {
    const site = user.siteCode
      ? await prisma.site.findUnique({
          where: { organizationId_code: { organizationId: organization.id, code: user.siteCode } },
        })
      : null;

    const passwordHash = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        jobTitle: user.jobTitle,
        role: user.role,
        siteId: site?.id ?? null,
      },
      create: {
        email: user.email,
        fullName: user.fullName,
        jobTitle: user.jobTitle,
        role: user.role,
        passwordHash,
        siteId: site?.id ?? null,
      },
    });
  }

  console.log(
    `Seeded ${ORGANIZATION.shortName}: ${SITES.length} sites, ${USERS.length} demonstration accounts.`,
  );

  for (const fileName of CATALOGUE_FILES) {
    const result = await seedCatalogue(fileName);
    console.log(`Seeded ${result.name}: ${result.themes} themes, ${result.controls} controls.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
