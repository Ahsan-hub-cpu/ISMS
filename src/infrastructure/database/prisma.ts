import "server-only";

import { PrismaClient } from "@prisma/client";

import { isProduction } from "@/infrastructure/config/env";

const createPrismaClient = () =>
  new PrismaClient({
    log: isProduction ? ["error"] : ["warn", "error"],
  });

// Next.js hot-reloads modules in development; caching the client on globalThis
// prevents the connection pool from being exhausted by duplicate instances.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
