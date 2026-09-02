import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  GapStatusBadge,
  PriorityBadge,
  RemediationStatusBadge,
  RiskBadge,
} from "@/components/domain/status-badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/stat";
import { can } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { evidenceService } from "@/modules/evidence";
import { gapService } from "@/modules/gap";
import { organizationService } from "@/modules/organization";
import { remediationService } from "@/modules/remediation";

import { EvidenceUploader } from "@/app/(app)/evidence/evidence-uploader";
import { GapDecisionForm } from "./gap-decision-form";

export const metadata: Metadata = { title: "Gap" };

const formatDate = (value: Date | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—";

export default async function GapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("gaps:read");
  const { id } = await params;
  const organizationId = await organizationService.currentId();

  const gap = await gapService.findById(id);
  if (!gap) notFound();

  const [blockers, actionsResult, evidenceResult] = await Promise.all([
    gapService.closureBlockers(id),
    remediationService.list(organizationId, { gapId: id, page: 1, pageSize: 20 }),
    evidenceService.list(organizationId, { gapId: id, page: 1, pageSize: 20 }),
  ]);

  const actions = actionsResult.ok ? actionsResult.value.items : [];
  const evidence = evidenceResult.ok ? evidenceResult.value.items : [];

  return (
    <>
      <PageHeader
        title={gap.summary}
        description={`${gap.reference} · raised by ${gap.assessmentReference} · ${gap.controlCode} ${gap.controlTitle}`}
        actions={
          <div className="flex items-center gap-2">
            <RiskBadge rating={gap.riskRating} />
            <GapStatusBadge status={gap.status} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="What was found"
              description={`Identified on ${formatDate(gap.identifiedAt)}${gap.identifiedByName ? ` by ${gap.identifiedByName}` : ""}.`}
            />
            <CardBody>
              <p className="whitespace-pre-line text-sm leading-relaxed">{gap.description}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Remediation"
              description="An action is scheduled automatically when the gap is raised. Its due date comes from this project's internal remediation SLA, not from ISO/IEC 27001."
            />
            <CardBody>
              {actions.length === 0 ? (
                <p className="text-sm text-content-muted">No action is linked to this gap.</p>
              ) : (
                <ul className="space-y-3">
                  {actions.map((action) => (
                    <li key={action.id} className="rounded-lg border px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/remediation/${action.id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          <span className="font-mono text-xs text-content-muted">
                            {action.reference}
                          </span>{" "}
                          {action.title}
                        </Link>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={action.priority} />
                          <RemediationStatusBadge status={action.status} />
                        </div>
                      </div>

                      <p className="mt-1 text-xs text-content-muted">
                        {action.ownerName ? `Owned by ${action.ownerName}` : "No owner assigned"} · due{" "}
                        {formatDate(action.dueAt)}
                      </p>

                      <Progress className="mt-2" value={action.progressPercent} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {can(session.role, "gaps:manage") ? (
            <Card>
              <CardHeader title="Assessor decision" />
              <CardBody>
                <GapDecisionForm gap={gap} closureBlockers={blockers} />
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="How the risk was rated"
              description={`Scored ${gap.riskScore} out of ${gap.riskMaximumScore} by this project's risk model. ISO/IEC 27001 requires an organisation to set its own risk criteria; it does not define this formula.`}
            />
            <CardBody className="space-y-3">
              {gap.riskMaximumScore > 0 ? (
                <Progress value={(gap.riskScore / gap.riskMaximumScore) * 100} />
              ) : null}

              <ul className="space-y-3 text-sm">
                {gap.riskFactors.map((factor) => (
                  <li key={factor.code}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium">{factor.label}</span>
                      <span className="shrink-0 tabular-nums text-content-muted">
                        {factor.points} / {factor.maximum}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-content-muted">{factor.detail}</p>
                  </li>
                ))}
              </ul>

              <p className="border-t pt-3 text-xs text-content-muted">
                {gap.riskScore} of {gap.riskMaximumScore} points falls in the{" "}
                <strong>{gap.riskRating.toLowerCase()}</strong> band.
                {gap.riskRatingOverridden
                  ? " An assessor has since overridden the rating by hand."
                  : ""}{" "}
                Model {gap.riskModelVersion || "unversioned"}.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Verification"
              description="What has to be true before this gap can be closed."
            />
            <CardBody className="space-y-2 text-sm">
              {gap.verifiedAt ? (
                <p className="text-content-muted">
                  Verified by {gap.verifiedByName ?? "an assessor"} on {formatDate(gap.verifiedAt)}.
                </p>
              ) : blockers.length === 0 ? (
                <p className="text-content-muted">
                  Everything needed for closure is in place; an assessor still has to confirm it.
                </p>
              ) : (
                <ul className="list-disc space-y-1 pl-4 text-content-muted">
                  {blockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Evidence" description="Anything that supports or closes this gap." />
            <CardBody className="space-y-3">
              {evidence.length === 0 ? (
                <p className="text-sm text-content-muted">No evidence attached yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {evidence.map((item) => (
                    <li key={item.id}>
                      <Link href="/evidence" className="font-medium hover:underline">
                        {item.title}
                      </Link>
                      <span className="block text-xs text-content-muted">
                        {item.uploadedByName ?? "Unknown"} · {formatDate(item.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {can(session.role, "evidence:upload") ? (
                <EvidenceUploader target={{ gapId: gap.id }} compact />
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
