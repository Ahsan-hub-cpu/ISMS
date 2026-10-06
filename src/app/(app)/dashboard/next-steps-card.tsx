import { ArrowRight, ListChecks } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { can, type Permission } from "@/modules/auth/domain/permissions";
import type { SessionUser } from "@/modules/auth/domain/user";

export interface NextStepItem {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly href: string;
  readonly cta: string;
  /** Shown only when the signed-in user holds this permission. */
  readonly permission: Permission;
  readonly count: number;
}

/** Role-filtered “what should I do now?” list for the dashboard. */
export const NextStepsCard = ({
  user,
  items,
}: {
  user: Pick<SessionUser, "permissions" | "fullName">;
  items: readonly NextStepItem[];
}) => {
  const visible = items.filter((item) => item.count > 0 && can(user, item.permission));

  return (
    <Card>
      <CardHeader
        icon={ListChecks}
        title={`Next steps for ${user.fullName}`}
        description="Open items waiting on your permissions. Status lives here — the app does not send email alerts."
      />
      <CardBody className="p-0">
        {visible.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-content-muted">
            Nothing is waiting on you right now. Check Gaps, Evidence or Assessments if you are
            following someone else&apos;s work.
          </p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {visible.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-content">
                    {item.title}{" "}
                    <span className="font-display tabular-nums text-brand-700 dark:text-brand-300">
                      ({item.count})
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-content-muted">{item.detail}</span>
                </span>
                <Link href={item.href}>
                  <Button variant="secondary" size="sm">
                    {item.cta}
                    <ArrowRight aria-hidden />
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
};
