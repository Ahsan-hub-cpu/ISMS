import { Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PriorityBadge, RemediationStatusBadge } from "@/components/domain/status-badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Progress, Stat } from "@/components/ui/stat";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { authService } from "@/modules/auth";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { organizationService } from "@/modules/organization";
import { isOverdue, remediationService } from "@/modules/remediation";
import { remediationQuerySchema } from "@/modules/remediation/application/schemas";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  REMEDIATION_STATUS_LABELS,
} from "@/modules/remediation/domain/entities";
import { hrefBuilder, parseQuery, type SearchParams } from "@/shared/utils/query";

export const metadata: Metadata = { title: "Remediation" };

const formatDate = (value: Date | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—";

export default async function RemediationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission("remediation:read");
  const organizationId = await organizationService.currentId();
  const rawParams = await searchParams;
  const query = parseQuery(remediationQuerySchema, rawParams);

  const [summaryResult, actionsResult, usersResult] = await Promise.all([
    remediationService.summarise(organizationId),
    remediationService.list(organizationId, query),
    authService.listUsers(),
  ]);

  const summary = summaryResult.ok ? summaryResult.value : null;
  const actions = actionsResult.ok ? actionsResult.value : null;
  const owners = usersResult.ok
    ? usersResult.value.filter((user) => user.isActive).map((user) => ({
        value: user.id,
        label: user.fullName,
      }))
    : [];

  const hrefWith = hrefBuilder("/remediation", rawParams);

  return (
    <>
      <PageHeader
        title="Remediation"
        description="Actions are raised automatically when a gap is identified. Priority and due date come from the gap's risk rating under this project's internal remediation SLA: 14 days for critical, 30 for high, 60 for medium and 90 for low."
      />

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Outstanding" value={summary.outstanding} />
          <Stat
            label="Overdue"
            value={summary.overdue}
            tone={summary.overdue > 0 ? "danger" : "success"}
          />
          <Stat label="In review" value={summary.byStatus.IN_REVIEW} tone="warning" />
          <Stat label="Completed" value={summary.completed} tone="success" />
        </div>
      ) : null}

      <Card>
        <CardHeader title="Action plan" description="Open work first, soonest due date at the top." />

        <CardBody className="space-y-4">
          <FilterBar
            searchPlaceholder="Search by reference, title or control…"
            filters={[
              {
                key: "status",
                label: "Any status",
                options: Object.entries(REMEDIATION_STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              },
              {
                key: "priority",
                label: "Any priority",
                className: "h-10 w-36",
                options: PRIORITIES.map((value) => ({ value, label: PRIORITY_LABELS[value] })),
              },
              { key: "ownerId", label: "Any owner", options: owners },
            ]}
          />

          {!actions || actions.items.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="Nothing to remediate"
              description="Actions appear here as soon as an assessment identifies a gap."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Action</TH>
                  <TH>Owner</TH>
                  <TH>Priority</TH>
                  <TH>Status</TH>
                  <TH>Progress</TH>
                  <TH>Due</TH>
                </TR>
              </THead>
              <tbody>
                {actions.items.map((action) => (
                  <TR key={action.id}>
                    <TD>
                      <Link
                        href={`/remediation/${action.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {action.title}
                      </Link>
                      <span className="mt-0.5 block text-xs text-content-muted">
                        <span className="font-mono">{action.reference}</span>
                        {action.gapReference ? ` · closes ${action.gapReference}` : null}
                      </span>
                    </TD>
                    <TD className="text-sm">
                      {action.ownerName ?? <span className="text-content-muted">Unassigned</span>}
                    </TD>
                    <TD>
                      <PriorityBadge priority={action.priority} />
                    </TD>
                    <TD>
                      <RemediationStatusBadge status={action.status} />
                    </TD>
                    <TD className="w-32">
                      <Progress value={action.progressPercent} />
                    </TD>
                    <TD className="text-sm">
                      {isOverdue(action) ? (
                        <span className="font-medium text-rose-600 dark:text-rose-400">
                          {formatDate(action.dueAt)}
                        </span>
                      ) : (
                        <span className="text-content-muted">{formatDate(action.dueAt)}</span>
                      )}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}

          {actions ? (
            <Pagination
              page={actions.page}
              totalPages={actions.totalPages}
              total={actions.total}
              buildHref={(page) => hrefWith({ page: String(page) })}
            />
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}
