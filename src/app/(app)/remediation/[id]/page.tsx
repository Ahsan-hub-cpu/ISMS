import { Download, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PriorityBadge, RemediationStatusBadge } from "@/components/domain/status-badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/stat";
import { authService } from "@/modules/auth";
import { can } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { evidenceService } from "@/modules/evidence";
import { organizationService } from "@/modules/organization";
import { isOverdue, remediationService } from "@/modules/remediation";

import { EvidenceUploader } from "@/app/(app)/evidence/evidence-uploader";
import { CommentForm } from "./comment-form";
import { ProgressForm } from "./progress-form";

export const metadata: Metadata = { title: "Remediation action" };

const formatDate = (value: Date | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—";

const formatDateTime = (value: Date) =>
  new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function RemediationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission("remediation:read");
  const { id } = await params;
  const organizationId = await organizationService.currentId();

  const action = await remediationService.findById(id);
  if (!action) notFound();

  const [evidenceResult, usersResult] = await Promise.all([
    evidenceService.list(organizationId, { remediationId: id, page: 1, pageSize: 20 }),
    authService.listUsers(),
  ]);

  const evidence = evidenceResult.ok ? evidenceResult.value.items : [];
  const owners = usersResult.ok
    ? usersResult.value
        .filter((user) => user.isActive)
        .map((user) => ({ id: user.id, name: user.fullName }))
    : [];

  const canPlan = can(session.role, "remediation:manage");
  const canUpdate = canPlan || action.ownerId === session.id;

  return (
    <>
      <PageHeader
        title={action.title}
        description={`${action.reference}${action.controlCode ? ` · ${action.controlCode} ${action.controlTitle}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <PriorityBadge priority={action.priority} />
            <RemediationStatusBadge status={action.status} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="What needs to happen" />
            <CardBody className="space-y-4">
              <p className="whitespace-pre-line text-sm leading-relaxed">{action.description}</p>
              <Progress value={action.progressPercent} label="Progress" />
            </CardBody>
          </Card>

          {canUpdate ? (
            <Card>
              <CardHeader
                title="Update this action"
                description={
                  canPlan
                    ? "You can also reassign the owner and change the schedule."
                    : "Report how far the work has got."
                }
              />
              <CardBody>
                <ProgressForm action={action} owners={owners} canPlan={canPlan} />
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Updates" description="A running record of how the work progressed." />
            <CardBody className="space-y-4">
              {action.comments.length === 0 ? (
                <p className="text-sm text-content-muted">No updates recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {action.comments.map((comment) => (
                    <li key={comment.id} className="rounded-lg border px-4 py-3">
                      <p className="text-sm">{comment.body}</p>
                      <p className="mt-1 text-xs text-content-muted">
                        {comment.authorName} · {formatDateTime(comment.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {canUpdate ? <CommentForm actionId={action.id} /> : null}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Details" />
            <CardBody>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-content-muted">Owner</dt>
                  <dd className="font-medium">{action.ownerName ?? "Unassigned"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-content-muted">Due</dt>
                  <dd
                    className={
                      isOverdue(action) ? "font-medium text-rose-600 dark:text-rose-400" : "font-medium"
                    }
                  >
                    {formatDate(action.dueAt)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-content-muted">Raised</dt>
                  <dd className="font-medium">{formatDate(action.createdAt)}</dd>
                </div>
                {action.completedAt ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-content-muted">Completed</dt>
                    <dd className="font-medium">{formatDate(action.completedAt)}</dd>
                  </div>
                ) : null}
                {action.gapId ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-content-muted">Closes</dt>
                    <dd>
                      <Link
                        href={`/gaps/${action.gapId}`}
                        className="font-mono text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
                      >
                        {action.gapReference}
                      </Link>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Evidence"
              description="Attach what proves the work was done before closing the action."
            />
            <CardBody className="space-y-3">
              {evidence.length === 0 ? (
                <p className="text-sm text-content-muted">No evidence attached yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {evidence.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-2">
                      <span>
                        <span className="block font-medium">{item.title}</span>
                        <span className="text-xs text-content-muted">
                          {item.uploadedByName ?? "Unknown"} · {formatDate(item.createdAt)}
                        </span>
                      </span>

                      {item.kind === "DOCUMENT" ? (
                        <a
                          href={`/api/evidence/${item.id}/file`}
                          className="shrink-0 text-brand-700 dark:text-brand-300"
                          aria-label={`Download ${item.title}`}
                        >
                          <Download className="size-4" aria-hidden />
                        </a>
                      ) : item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="shrink-0 text-brand-700 dark:text-brand-300"
                          aria-label={`Open ${item.title}`}
                        >
                          <ExternalLink className="size-4" aria-hidden />
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              {can(session.role, "evidence:upload") ? (
                <EvidenceUploader target={{ remediationId: action.id }} compact />
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
