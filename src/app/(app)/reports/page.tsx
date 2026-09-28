import {
  BarChart3,
  ClipboardCheck,
  Download,
  Flame,
  Layers,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
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
        eyebrow="Reporting"
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={ShieldCheck}
              label="Compliance"
              value={`${assessment.compliancePercent}%`}
              hint={`${assessment.reference} · ${assessment.title}`}
              tone={assessment.compliancePercent >= 80 ? "success" : "warning"}
            />
            <Stat
              icon={ClipboardCheck}
              label="Assessment complete"
              value={`${assessment.completionPercent}%`}
              hint={`${assessment.byStatus.NOT_ASSESSED} controls still to assess`}
              tone="brand"
            />
            <Stat
              icon={ShieldAlert}
              label="Outstanding gaps"
              value={totalOutstandingGaps}
              tone={totalOutstandingGaps > 0 ? "warning" : "success"}
            />
            <Stat
              icon={Flame}
              label="Critical and high"
              value={(overview?.gapsByRisk.CRITICAL ?? 0) + (overview?.gapsByRisk.HIGH ?? 0)}
              tone={
                (overview?.gapsByRisk.CRITICAL ?? 0) + (overview?.gapsByRisk.HIGH ?? 0) > 0
                  ? "danger"
                  : "success"
              }
            />
          </div>

          <p className="rounded-lg border border-surface-border bg-surface-sunken/60 px-4 py-3 text-xs leading-relaxed text-content-muted">
            {COMPLIANCE_FORMULA_NOTE}
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                icon={ClipboardCheck}
                title="Findings"
                description="How the assessed controls were rated."
              />
              <CardBody className="space-y-3.5">
                {Object.entries(assessment.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-[0.8125rem] text-content-muted">
                      {COMPLIANCE_STATUS_LABELS[status as keyof typeof COMPLIANCE_STATUS_LABELS]}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken ring-1 ring-inset ring-surface-border">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
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
                    <span className="w-8 shrink-0 text-right font-display text-sm font-semibold tabular-nums">
                      {count}
                    </span>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={ShieldAlert}
                title="Outstanding risk"
                description="Gaps that are still open or being remediated."
              />
              <CardBody className="space-y-3.5">
                {RISK_RATINGS.map((rating) => {
                  const count = overview?.gapsByRisk[rating] ?? 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 text-[0.8125rem] text-content-muted">
                        {RISK_LABELS[rating]}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken ring-1 ring-inset ring-surface-border">
                        <div
                          className={cn(
                            "h-full rounded-full transition-[width] duration-500",
                            RISK_BAR_COLOURS[rating],
                          )}
                          style={{
                            width: `${Math.round((count / Math.max(1, totalOutstandingGaps)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right font-display text-sm font-semibold tabular-nums">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              icon={Layers}
              title="Compliance by theme"
              description="Where the weakest areas of the management system are."
            />
            <CardBody className="p-0">
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
                icon={TrendingUp}
                title="Compliance over time"
                description="Each assessment compared with the ones before it."
              />
              <CardBody>
                <div className="flex items-end gap-5 overflow-x-auto pb-2">
                  {overview.trend.map((point) => (
                    <div
                      key={point.label}
                      className="flex w-20 shrink-0 flex-col items-center gap-2"
                    >
                      <span className="font-display text-xs font-semibold tabular-nums text-content">
                        {point.compliancePercent}%
                      </span>
                      <div className="flex h-32 w-9 items-end overflow-hidden rounded-lg bg-surface-sunken ring-1 ring-inset ring-surface-border">
                        <div
                          className="w-full rounded-lg bg-gradient-to-t from-brand-700 to-brand-400"
                          style={{ height: `${Math.max(3, point.compliancePercent)}%` }}
                        />
                      </div>
                      <span className="text-center font-mono text-[0.625rem] text-content-subtle">
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
          icon={Download}
          title="Exports"
          description="Comma-separated files that open directly in Excel."
        />
        <CardBody className="p-0">
          <ul className="divide-y divide-surface-border">
            {REPORT_KINDS.map((kind) => (
              <li
                key={kind}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-content">{REPORT_LABELS[kind]}</p>
                  <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-content-muted">
                    {REPORT_DESCRIPTIONS[kind]}
                  </p>
                </div>
                <a
                  href={`/api/reports/${kind}`}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-surface-border-strong bg-surface-raised px-3.5 text-[0.8125rem] font-medium transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-brand-950/50"
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
