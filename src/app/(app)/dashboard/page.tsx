import {
  ArrowRight,
  ClipboardCheck,
  ClipboardList,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { RemediationStatusBadge, RiskBadge } from "@/components/domain/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress, Stat } from "@/components/ui/stat";
import { assessmentService } from "@/modules/assessment";
import { requireSession } from "@/modules/auth/presentation/guards";
import { complianceService } from "@/modules/compliance";
import { evidenceService } from "@/modules/evidence";
import { gapService } from "@/modules/gap";
import { organizationService } from "@/modules/organization";
import { registerService } from "@/modules/register";
import { isOverdue, remediationService } from "@/modules/remediation";

import { NextStepsCard, type NextStepItem } from "./next-steps-card";

const formatDate = (value: Date | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—";

export default async function DashboardPage() {
  const session = await requireSession();
  const organizationId = await organizationService.currentId();

  const [
    profileResult,
    overviewResult,
    registerResult,
    gapsResult,
    actionsResult,
    myActionsResult,
    pendingEvidenceResult,
    submittedAssessmentsResult,
    awaitingReviewGapsResult,
  ] = await Promise.all([
    organizationService.getProfile(),
    complianceService.overview(organizationId),
    registerService.summarise(organizationId),
    gapService.list({ outstandingOnly: true, page: 1, pageSize: 5 }),
    remediationService.list(organizationId, { overdueOnly: true, page: 1, pageSize: 5 }),
    remediationService.list(organizationId, {
      ownerId: session.id,
      page: 1,
      pageSize: 50,
    }),
    evidenceService.list(organizationId, { reviewStatus: "PENDING", page: 1, pageSize: 1 }),
    assessmentService.list(organizationId, { status: "SUBMITTED", page: 1, pageSize: 1 }),
    gapService.list({ status: "AWAITING_REVIEW", page: 1, pageSize: 1 }),
  ]);

  const profile = profileResult.ok ? profileResult.value : null;
  const overview = overviewResult.ok ? overviewResult.value : null;
  const register = registerResult.ok ? registerResult.value : null;
  const topGaps = gapsResult.ok ? gapsResult.value : null;
  const overdueActions = actionsResult.ok ? actionsResult.value : null;
  const assessment = overview?.assessment ?? null;

  const openGaps = topGaps?.total ?? 0;
  const overdueCount = overdueActions?.total ?? 0;

  const ownedOpenCount = myActionsResult.ok
    ? myActionsResult.value.items.filter(
        (action) => action.status === "OPEN" || action.status === "IN_PROGRESS",
      ).length
    : 0;
  const pendingEvidenceCount = pendingEvidenceResult.ok ? pendingEvidenceResult.value.total : 0;
  const submittedCount = submittedAssessmentsResult.ok
    ? submittedAssessmentsResult.value.total
    : 0;
  const awaitingReviewCount = awaitingReviewGapsResult.ok
    ? awaitingReviewGapsResult.value.total
    : 0;

  const nextSteps: NextStepItem[] = [
    {
      id: "my-remediation",
      title: "Remediation assigned to you",
      detail: "Update progress and upload evidence on the gap.",
      href: "/remediation",
      cta: "Open remediation",
      permission: "remediation:update",
      count: ownedOpenCount,
    },
    {
      id: "pending-evidence",
      title: "Evidence waiting for review",
      detail: "Accept or reject uploads before a gap can close.",
      href: "/evidence?reviewStatus=PENDING",
      cta: "Review evidence",
      permission: "evidence:review",
      count: pendingEvidenceCount,
    },
    {
      id: "gaps-awaiting",
      title: "Gaps awaiting review",
      detail: "Owner says fixed — confirm Resolved when blockers are clear.",
      href: "/gaps?status=AWAITING_REVIEW",
      cta: "Open gaps",
      permission: "gaps:manage",
      count: awaitingReviewCount,
    },
    {
      id: "assessments-submitted",
      title: "Assessments waiting for approval",
      detail: "Stamp Approve when the assessor has submitted.",
      href: "/assessments?status=SUBMITTED",
      cta: "Open assessments",
      permission: "assessments:approve",
      count: submittedCount,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description={
          profile
            ? `Information security posture for ${profile.organization.name}.`
            : "Information security posture."
        }
        actions={
          assessment ? (
            <Badge tone="brand" dot>
              {assessment.reference} · {assessment.status.replaceAll("_", " ").toLowerCase()}
            </Badge>
          ) : null
        }
      />

      <NextStepsCard user={session} items={nextSteps} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={ShieldCheck}
          label="Compliance"
          value={assessment ? `${assessment.compliancePercent}%` : "—"}
          hint={
            assessment
              ? `${assessment.completionPercent}% of controls assessed`
              : "No assessment yet"
          }
          tone={assessment && assessment.compliancePercent >= 80 ? "success" : "warning"}
        />
        <Stat
          icon={Layers}
          label="Implementation"
          value={register ? `${register.implementationPercent}%` : "—"}
          hint={register ? `${register.applicable} controls in scope` : undefined}
          tone="brand"
        />
        <Stat
          icon={ShieldAlert}
          label="Outstanding gaps"
          value={openGaps}
          hint={openGaps > 0 ? "Awaiting remediation or verification" : "Nothing outstanding"}
          tone={openGaps > 0 ? "warning" : "success"}
        />
        <Stat
          icon={Timer}
          label="Overdue actions"
          value={overdueCount}
          hint={overdueCount > 0 ? "Past the internal SLA date" : "All actions on schedule"}
          tone={overdueCount > 0 ? "danger" : "success"}
        />
      </div>

      {assessment ? (
        <Card>
          <CardHeader
            icon={ClipboardList}
            title="Current assessment"
            description={assessment.title}
            action={
              <Link href="/assessments">
                <Button variant="secondary" size="sm">
                  Open
                  <ArrowRight aria-hidden />
                </Button>
              </Link>
            }
          />
          <CardBody className="grid gap-6 sm:grid-cols-2 sm:gap-8">
            <Progress value={assessment.completionPercent} label="Controls assessed" />
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
            description="The control register is filled from the catalogue. Once you score controls, gaps and remediation actions are created for you."
            action={
              <Link href="/assessments">
                <Button>
                  Go to assessments
                  <ArrowRight aria-hidden />
                </Button>
              </Link>
            }
          />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            icon={ShieldAlert}
            title="Highest risk gaps"
            description="Outstanding gaps, most severe first."
            action={
              <Link
                href="/gaps"
                className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
              >
                View all
              </Link>
            }
          />
          <CardBody className="p-0">
            {!topGaps || topGaps.items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-content-muted">
                No outstanding gaps.
              </p>
            ) : (
              <ul className="divide-y divide-surface-border">
                {topGaps.items.map((gap) => (
                  <li key={gap.id}>
                    <Link
                      href={`/gaps/${gap.id}`}
                      className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-brand-50/50 dark:hover:bg-brand-950/25"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-content">
                          {gap.summary}
                        </span>
                        <span className="mt-0.5 block text-xs text-content-subtle">
                          {gap.reference} · {gap.controlCode}
                        </span>
                      </span>
                      <RiskBadge rating={gap.riskRating} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={Wrench}
            title="Overdue remediation"
            description="Work that has passed its scheduled date."
            action={
              <Link
                href="/remediation"
                className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
              >
                View all
              </Link>
            }
          />
          <CardBody className="p-0">
            {!overdueActions || overdueActions.items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-content-muted">Nothing is overdue.</p>
            ) : (
              <ul className="divide-y divide-surface-border">
                {overdueActions.items.map((action) => (
                  <li key={action.id}>
                    <Link
                      href={`/remediation/${action.id}`}
                      className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-brand-50/50 dark:hover:bg-brand-950/25"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-content">
                          {action.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-content-subtle">
                          {action.ownerName ?? "Unassigned"} · due {formatDate(action.dueAt)}
                          {isOverdue(action) ? " (overdue)" : ""}
                        </span>
                      </span>
                      <RemediationStatusBadge status={action.status} />
                    </Link>
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
            icon={Layers}
            title="Weakest themes"
            description="Areas of the framework with the lowest compliance."
            action={
              <Link
                href="/reports"
                className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
              >
                Full report
              </Link>
            }
          />
          <CardBody className="space-y-4">
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
