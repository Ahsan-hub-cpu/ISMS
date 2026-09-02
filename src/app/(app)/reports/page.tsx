import { BarChart3, Download } from "lucide-react";
import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress, Stat } from "@/components/ui/stat";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { COMPLIANCE_FORMULA_NOTE, COMPLIANCE_STATUS_LABELS } from "@/modules/assessment";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { REPORT_KINDS, REPORT_LABELS, complianceService } from "@/modules/compliance";
import { RISK_LABELS, RISK_RATINGS } from "@/modules/gap";
import { organizationService } from "@/modules/organization";
import { cn } from "@/shared/utils/cn";

export const metadata: Metadata = { title: "Reports" };

const REPORT_DESCRIPTIONS: Record<string, string> = {
  "statement-of-applicability":
    "Every control with its applicability, justification, owner and implementation status.",
  "gap-register":
    "All identified gaps with the risk score, the factors behind it, status and recommendation.",
  "remediation-plan":
    "The action plan with owners, priorities, internal SLA due dates and progress.",
};

const RISK_BAR_COLOURS: Record<string, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-rose-600",
};

export default async function ReportsPage() {
  await requirePermission("reports:read");
  const organizationId = await organizationService.currentId();

  const overviewResult = await complianceService.overview(organizationId);
  const overview = overviewResult.ok ? overviewResult.value : null;
  const assessment = overview?.assessment ?? null;

  const totalOutstandingGaps = RISK_RATINGS.reduce(
    (sum, rating) => sum + (overview?.gapsByRisk[rating] ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Compliance reporting"
        description="Where the organisation stands against the framework, and the exports an auditor will ask for."
      />

      {!assessment ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="Nothing to report yet"
            description="Once an assessment has been started and findings recorded, compliance figures appear here."
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Compliance"
              value={`${assessment.compliancePercent}%`}
              hint={`${assessment.reference} · ${assessment.title}`}
              tone={assessment.compliancePercent >= 80 ? "success" : "warning"}
            />
            <Stat
              label="Assessment complete"
              value={`${assessment.completionPercent}%`}
              hint={`${assessment.byStatus.NOT_ASSESSED} controls still to assess`}
            />
            <Stat
              label="Outstanding gaps"
              value={totalOutstandingGaps}
              tone={totalOutstandingGaps > 0 ? "warning" : "success"}
            />
            <Stat
              label="Critical and high"
              value={
                (overview?.gapsByRisk.CRITICAL ?? 0) + (overview?.gapsByRisk.HIGH ?? 0)
              }
              tone={
                (overview?.gapsByRisk.CRITICAL ?? 0) + (overview?.gapsByRisk.HIGH ?? 0) > 0
                  ? "danger"
                  : "success"
              }
            />
          </div>

          <p className="text-xs text-content-muted">{COMPLIANCE_FORMULA_NOTE}</p>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Findings"
                description="How the assessed controls were rated."
              />
              <CardBody className="space-y-3">
                {Object.entries(assessment.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-sm text-content-muted">
                      {COMPLIANCE_STATUS_LABELS[status as keyof typeof COMPLIANCE_STATUS_LABELS]}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-brand-600"
                        style={{
                          width: `${Math.round(
                            (count /
                              Math.max(
                                1,
                                Object.values(assessment.byStatus).reduce((a, b) => a + b, 0),
                              )) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-sm tabular-nums">{count}</span>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Outstanding risk"
                description="Gaps that are still open or being remediated."
              />
              <CardBody className="space-y-3">
                {RISK_RATINGS.map((rating) => {
                  const count = overview?.gapsByRisk[rating] ?? 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 text-sm text-content-muted">
                        {RISK_LABELS[rating]}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={cn("h-full rounded-full", RISK_BAR_COLOURS[rating])}
                          style={{
                            width: `${Math.round((count / Math.max(1, totalOutstandingGaps)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-sm tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Compliance by theme"
              description="Where the weakest areas of the management system are."
            />
            <CardBody>
              <Table>
                <THead>
                  <TR>
                    <TH>Theme</TH>
                    <TH className="w-64">Compliance</TH>
                    <TH>Compliant</TH>
                    <TH>Partial</TH>
                    <TH>Non-compliant</TH>
                    <TH>Open gaps</TH>
                  </TR>
                </THead>
                <tbody>
                  {overview?.themes.map((theme) => (
                    <TR key={theme.themeCode}>
                      <TD>
                        <span className="font-mono text-xs text-content-muted">
                          {theme.themeCode}
                        </span>
                        <span className="block text-sm font-medium">{theme.themeName}</span>
                      </TD>
                      <TD>
                        <Progress value={theme.compliancePercent} />
                      </TD>
                      <TD className="text-sm tabular-nums">{theme.byStatus.COMPLIANT}</TD>
                      <TD className="text-sm tabular-nums">
                        {theme.byStatus.PARTIALLY_COMPLIANT}
                      </TD>
                      <TD className="text-sm tabular-nums">{theme.byStatus.NON_COMPLIANT}</TD>
                      <TD className="text-sm tabular-nums">{theme.openGaps}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>

          {overview && overview.trend.length > 1 ? (
            <Card>
              <CardHeader
                title="Compliance over time"
                description="Each assessment compared with the ones before it."
              />
              <CardBody>
                <div className="flex items-end gap-4 overflow-x-auto pb-2">
                  {overview.trend.map((point) => (
                    <div key={point.label} className="flex w-20 shrink-0 flex-col items-center gap-2">
                      <span className="text-xs font-medium tabular-nums">
                        {point.compliancePercent}%
                      </span>
                      <div className="flex h-32 w-8 items-end rounded-md bg-slate-100 dark:bg-slate-800">
                        <div
                          className="w-full rounded-md bg-brand-600"
                          style={{ height: `${Math.max(2, point.compliancePercent)}%` }}
                        />
                      </div>
                      <span className="text-center font-mono text-[10px] text-content-muted">
                        {point.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : null}
        </>
      )}

      <Card>
        <CardHeader
          title="Exports"
          description="Comma-separated files that open directly in Excel."
        />
        <CardBody>
          <ul className="divide-y">
            {REPORT_KINDS.map((kind) => (
              <li key={kind} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{REPORT_LABELS[kind]}</p>
                  <p className="text-sm text-content-muted">{REPORT_DESCRIPTIONS[kind]}</p>
                </div>
                <a
                  href={`/api/reports/${kind}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <Download className="size-4" aria-hidden />
                  Download CSV
                </a>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </>
  );
}
