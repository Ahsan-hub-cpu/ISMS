import { Bell, CheckCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/modules/auth/presentation/guards";
import {
  listNotificationsFor,
  markAllNotificationsRead,
} from "@/modules/notifications";

import { MarkReadButton } from "./mark-read-button";

export const metadata: Metadata = { title: "My work" };

const formatWhen = (value: Date) =>
  new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function MyWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ markAll?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  if (params.markAll === "1") {
    await markAllNotificationsRead(session.id);
  }

  const items = await listNotificationsFor(session.id);
  const unread = items.filter((item) => item.readAt === null).length;

  return (
    <>
      <PageHeader
        eyebrow="Work queue"
        title="My work"
        description="Notifications when it is your turn — assign, assess, fix, review, or approve."
        actions={
          unread > 0 ? (
            <Link href="/work?markAll=1">
              <Button variant="secondary" size="sm">
                <CheckCheck aria-hidden />
                Mark all read
              </Button>
            </Link>
          ) : null
        }
      />

      <Card>
        <CardHeader
          icon={Bell}
          title={unread > 0 ? `${unread} waiting on you` : "Inbox"}
          description="Open an item to go straight to the screen where you act."
        />
        <CardBody className="p-0">
          {items.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Nothing in your queue"
              description="When someone assigns a control, raises a gap, uploads evidence, or submits an assessment, it appears here for the right role."
            />
          ) : (
            <ul className="divide-y divide-surface-border">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={
                    item.readAt
                      ? "bg-surface-raised"
                      : "bg-brand-50/40 dark:bg-brand-950/20"
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                    <Link href={item.href} className="min-w-0 flex-1 hover:underline">
                      <span className="block text-sm font-semibold text-content">{item.title}</span>
                      <span className="mt-1 block text-sm text-content-muted">{item.body}</span>
                      <span className="mt-1.5 block text-xs text-content-subtle">
                        {formatWhen(item.createdAt)}
                        {item.readAt ? "" : " · unread"}
                      </span>
                    </Link>
                    {!item.readAt ? <MarkReadButton id={item.id} /> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
