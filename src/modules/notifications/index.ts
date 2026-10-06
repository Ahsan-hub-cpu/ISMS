import "server-only";

import { prisma } from "@/infrastructure/database/prisma";

export interface AppNotification {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly href: string;
  readonly readAt: Date | null;
  readonly createdAt: Date;
}

export interface NotifyDraft {
  readonly userId: string;
  readonly title: string;
  readonly body: string;
  readonly href: string;
}

const toNotification = (row: {
  id: string;
  title: string;
  body: string;
  href: string;
  readAt: Date | null;
  createdAt: Date;
}): AppNotification => ({
  id: row.id,
  title: row.title,
  body: row.body,
  href: row.href,
  readAt: row.readAt,
  createdAt: row.createdAt,
});

/** Notify one or many users. Skips empty lists and duplicate consecutive noise is acceptable for demo clarity. */
export const notifyUsers = async (drafts: readonly NotifyDraft[]): Promise<void> => {
  if (drafts.length === 0) return;

  await prisma.notification.createMany({
    data: drafts.map((draft) => ({
      userId: draft.userId,
      title: draft.title,
      body: draft.body,
      href: draft.href,
    })),
  });
};

export const listNotificationsFor = async (
  userId: string,
  options?: { unreadOnly?: boolean; take?: number },
): Promise<AppNotification[]> => {
  const rows = await prisma.notification.findMany({
    where: {
      userId,
      ...(options?.unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.take ?? 40,
  });

  return rows.map(toNotification);
};

export const countUnreadNotifications = async (userId: string): Promise<number> =>
  prisma.notification.count({ where: { userId, readAt: null } });

export const markNotificationRead = async (userId: string, id: string): Promise<void> => {
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
};

/** Active users that hold a given permission (for role-based queues). */
export const userIdsWithPermission = async (
  permission: string,
  options?: { excludeUserId?: string },
): Promise<string[]> => {
  const rows = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(options?.excludeUserId ? { id: { not: options.excludeUserId } } : {}),
      role: { permissions: { some: { permission } } },
    },
    select: { id: true },
  });

  return rows.map((row) => row.id);
};
