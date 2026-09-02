import { ArrowRight, ClipboardCheck } from "lucide-react";
import Link from "next/link";

import { RemediationStatusBadge, RiskBadge } from "@/components/domain/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress, Stat } from "@/components/ui/stat";
import { complianceService } from "@/modules/compliance";
import { gapService } from "@/modules/gap";
import { organizationService } from "@/modules/organization";
import { registerService } from "@/modules/register";
import { isOverdue, remediationService } from "@/modules/remediation";

const formatDate = (value: Date | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—";

export default async function DashboardPage() {
  const organizationId = await organizationService.currentId();

  const [profileResult, overviewResult, registerResult, gapsResult, actionsResult] =
    await Promise.all([
      organizationService.getProfile(),
      complianceService.overview(organizationId),
      registerService.summarise(organizationId),
      gapService.list({ outstandingOnly: true, page: 1, pageSize: 5 }),
      remediationService.list(organizationId, { overdueOnly: true, page: 1, pageSize: 5 }),
    ]);

  const profile = profileResult.ok ? profileResult.value : null;
  const overview = overviewResult.ok ? overviewResult.value : null;
  const register = registerResult.ok ? registerResult.value : null;
  const topGaps = gapsResult.ok ? gapsResult.value : null;
  const overdueActions = actionsResult.ok ? actionsResult.value : null;
  const assessment = overview?.assessment ?? null;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          profile
            ? `Information security posture for ${profile.organization.name}.`
            : "Information security posture."
        }
        actions={
          assessment ? (
            <Badge tone="brand">
              {assessment.reference} · {assessment.status.replaceAll("_", " ").toLowerCase()}
            </Badge>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Compliance"
          value={assessment ? `${assessment.compliancePercent}%` : "—"}
          hint={assessment ? `${assessment.completionPercent}% of controls assessed` : "No assessment yet"}
          tone={assessment && assessment.compliancePercent >= 80 ? "success" : "warning"}
        />
        <Stat
          label="Implementation"
          value={register ? `${register.implementationPercent}%` : "—"}
          hint={register ? `${register.applicable} controls in scope` : undefined}
        />
        <Stat
          label="Outstanding gaps"
          value={topGaps?.total ?? 0}
          tone={(topGaps?.total ?? 0) > 0 ? "warning" : "success"}
        />
        <Stat
          label="Overdue actions"
          value={overdueActions?.total ?? 0}
          tone={(overdueActions?.total ?? 0) > 0 ? "danger" : "success"}
        />
      </div>

      {assessment ? (
        <Card>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Progress
              value={assessment.completionPercent}
              label={`${assessment.title} · assessment progress`}
            />
            <Progress
              value={register?.implementationPercent ?? 0}
              label="Weighted implementation across the register"
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            title="Start the first assessment"
            description="The control register is already filled from the catalogue. Once you assess controls, gaps and remediation actions are created for you."
            action={
              <Link
                href="/assessments"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                Go to assessments
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Highest risk gaps"
            description="Outstanding gaps, most severe first."
            action={
              <Link href="/gaps" className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300">
                View all
              </Link>
            }
          />
          <CardBody>
            {!topGaps || topGaps.items.length === 0 ? (
              <p className="text-sm text-content-muted">No outstanding gaps.</p>
            ) : (
              <ul className="divide-y">
                {topGaps.items.map((gap) => (
                  <li key={gap.id} className="flex items-start justify-between gap-3 py-2.5">
                    <Link href={`/gaps/${gap.id}`} className="min-w-0 hover:underline">
                      <span className="block text-sm font-medium">{gap.summary}</span>
                      <span className="text-xs text-content-muted">
                        {gap.reference} · {gap.controlCode}
                      </span>
                    </Link>
                    <RiskBadge rating={gap.riskRating} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Overdue remediation"
            description="Work that has passed its scheduled date."
            action={
              <Link
                href="/remediation"
                className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
              >
                View all
              </Link>
            }
          />
          <CardBody>
            {!overdueActions || overdueActions.items.length === 0 ? (
              <p className="text-sm text-content-muted">Nothing is overdue.</p>
            ) : (
              <ul className="divide-y">
                {overdueActions.items.map((action) => (
                  <li key={action.id} className="flex items-start justify-between gap-3 py-2.5">
                    <Link href={`/remediation/${action.id}`} className="min-w-0 hover:underline">
                      <span className="block text-sm font-medium">{action.title}</span>
                      <span className="text-xs text-content-muted">
                        {action.ownerName ?? "Unassigned"} · due {formatDate(action.dueAt)}
                        {isOverdue(action) ? " (overdue)" : ""}
                      </span>
                    </Link>
                    <RemediationStatusBadge status={action.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {overview && overview.themes.length > 0 ? (
        <Card>
          <CardHeader
            title="Weakest themes"
            description="Areas of the framework with the lowest compliance."
            action={
              <Link
                href="/reports"
                className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
              >
                Full report
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {[...overview.themes]
              .sort((a, b) => a.compliancePercent - b.compliancePercent)
              .slice(0, 4)
              .map((theme) => (
                <Progress
                  key={theme.themeCode}
                  value={theme.compliancePercent}
                  label={`${theme.themeCode} ${theme.themeName}`}
                />
              ))}
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}
