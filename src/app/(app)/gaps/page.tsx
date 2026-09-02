import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { GapStatusBadge, RiskBadge } from "@/components/domain/status-badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Stat } from "@/components/ui/stat";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { GAP_STATUS_LABELS, RISK_LABELS, gapService } from "@/modules/gap";
import { gapQuerySchema } from "@/modules/gap/application/schemas";
import { hrefBuilder, parseQuery, type SearchParams } from "@/shared/utils/query";

export const metadata: Metadata = { title: "Gaps" };

const formatDate = (value: Date) =>
  new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" });

export default async function GapsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission("gaps:read");
  const rawParams = await searchParams;
  const query = parseQuery(gapQuerySchema, rawParams);

  const [summaryResult, gapsResult] = await Promise.all([
    gapService.summarise(),
    gapService.list(query),
  ]);

  const summary = summaryResult.ok ? summaryResult.value : null;
  const gaps = gapsResult.ok ? gapsResult.value : null;
  const hrefWith = hrefBuilder("/gaps", rawParams);

  return (
    <>
      <PageHeader
        title="Gaps"
        description="Gaps are raised by the assessment itself. When a control is found short, the difference is recorded here and scored by this project's own risk model, which ISO/IEC 27001 leaves each organisation to define."
      />

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Critical"
            value={summary.byRisk.CRITICAL}
            tone={summary.byRisk.CRITICAL > 0 ? "danger" : "success"}
            hint="Outstanding"
          />
          <Stat
            label="High"
            value={summary.byRisk.HIGH}
            tone={summary.byRisk.HIGH > 0 ? "warning" : "success"}
            hint="Outstanding"
          />
          <Stat
            label="Outstanding in total"
            value={summary.open}
            hint={`${summary.awaitingReview} awaiting assessor verification`}
          />
          <Stat
            label="Closed"
            value={summary.resolved + summary.accepted}
            hint={`${summary.accepted} accepted as residual risk`}
            tone="success"
          />
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Gap register"
          description="Highest risk first. Open a gap to see how its rating was derived."
        />

        <CardBody className="space-y-4">
          <FilterBar
            searchPlaceholder="Search by reference, control or summary…"
            filters={[
              {
                key: "riskRating",
                label: "Any risk",
                className: "h-10 w-36",
                options: Object.entries(RISK_LABELS).map(([value, label]) => ({ value, label })),
              },
              {
                key: "status",
                label: "Any status",
                options: Object.entries(GAP_STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              },
            ]}
          />

          {!gaps || gaps.items.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No gaps to show"
              description="Gaps appear here as soon as an assessor records a control as partially or non-compliant."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Reference</TH>
                  <TH>Control</TH>
                  <TH>Risk</TH>
                  <TH>Status</TH>
                  <TH>Open actions</TH>
                  <TH>Identified</TH>
                </TR>
              </THead>
              <tbody>
                {gaps.items.map((gap) => (
                  <TR key={gap.id}>
                    <TD>
                      <Link
                        href={`/gaps/${gap.id}`}
                        className="font-mono text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
                      >
                        {gap.reference}
                      </Link>
                    </TD>
                    <TD>
                      <span className="block text-sm font-medium">{gap.summary}</span>
                      <span className="text-xs text-content-muted">
                        {gap.controlCode} {gap.controlTitle}
                      </span>
                    </TD>
                    <TD>
                      <RiskBadge rating={gap.riskRating} />
                    </TD>
                    <TD>
                      <GapStatusBadge status={gap.status} />
                    </TD>
                    <TD className="text-sm tabular-nums">{gap.openActions}</TD>
                    <TD className="text-xs text-content-muted">
                      {formatDate(gap.identifiedAt)}
                      {gap.identifiedByName ? (
                        <span className="mt-0.5 block">by {gap.identifiedByName}</span>
                      ) : null}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}

          {gaps ? (
            <Pagination
              page={gaps.page}
              totalPages={gaps.totalPages}
              total={gaps.total}
              buildHref={(page) => hrefWith({ page: String(page) })}
            />
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}
