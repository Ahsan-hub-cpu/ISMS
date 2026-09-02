import { Download, ExternalLink, FolderLock } from "lucide-react";
import type { Metadata } from "next";

import { EvidenceReviewBadge } from "@/components/domain/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Stat } from "@/components/ui/stat";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { can } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/presentation/guards";
import {
  EVIDENCE_KIND_LABELS,
  EVIDENCE_KINDS,
  EVIDENCE_REVIEW_LABELS,
  evidenceService,
  formatFileSize,
  isExpired,
} from "@/modules/evidence";
import { evidenceQuerySchema } from "@/modules/evidence/application/schemas";
import { organizationService } from "@/modules/organization";
import { hrefBuilder, parseQuery, type SearchParams } from "@/shared/utils/query";

import { EvidenceReview } from "./evidence-review";

export const metadata: Metadata = { title: "Evidence" };

const formatDate = (value: Date | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—";

export default async function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requirePermission("evidence:read");
  const organizationId = await organizationService.currentId();
  const rawParams = await searchParams;
  const query = parseQuery(evidenceQuerySchema, rawParams);

  const [summaryResult, evidenceResult] = await Promise.all([
    evidenceService.summarise(organizationId),
    evidenceService.list(organizationId, query),
  ]);

  const summary = summaryResult.ok ? summaryResult.value : null;
  const evidence = evidenceResult.ok ? evidenceResult.value : null;
  const canReview = can(session.role, "evidence:review");
  const hrefWith = hrefBuilder("/evidence", rawParams);

  return (
    <>
      <PageHeader
        title="Evidence"
        description="Documents and links that prove a control works or that a remediation action was completed."
      />

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total items" value={summary.total} />
          <Stat
            label="Awaiting review"
            value={summary.pending}
            tone={summary.pending > 0 ? "warning" : "success"}
          />
          <Stat label="Accepted" value={summary.accepted} tone="success" />
          <Stat
            label="Expired"
            value={summary.expired}
            tone={summary.expired > 0 ? "danger" : "success"}
          />
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="All evidence"
          description="Attach evidence from a control, gap or remediation action so it is always linked to something."
        />

        <CardBody className="space-y-4">
          <FilterBar
            searchPlaceholder="Search by title, note or file name…"
            filters={[
              {
                key: "reviewStatus",
                label: "Any review status",
                options: Object.entries(EVIDENCE_REVIEW_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              },
              {
                key: "kind",
                label: "Any type",
                className: "h-10 w-36",
                options: EVIDENCE_KINDS.map((kind) => ({
                  value: kind,
                  label: EVIDENCE_KIND_LABELS[kind],
                })),
              },
            ]}
          />

          {!evidence || evidence.items.length === 0 ? (
            <EmptyState
              icon={FolderLock}
              title="No evidence yet"
              description="Open a control, gap or remediation action and attach the document or link that supports it."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Evidence</TH>
                  <TH>Attached to</TH>
                  <TH>Review</TH>
                  <TH>Valid until</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <tbody>
                {evidence.items.map((item) => (
                  <TR key={item.id}>
                    <TD>
                      <span className="block text-sm font-medium">{item.title}</span>
                      <span className="text-xs text-content-muted">
                        {item.kind === "DOCUMENT"
                          ? `${item.fileName ?? "File"} · ${formatFileSize(item.fileSize)}`
                          : item.url}
                      </span>
                      <span className="mt-0.5 block text-xs text-content-muted">
                        Added by {item.uploadedByName ?? "Unknown"} on {formatDate(item.createdAt)}
                      </span>
                    </TD>
                    <TD className="space-x-1">
                      {item.links.map((link) => (
                        <Badge key={link.id}>
                          {link.controlCode ??
                            link.gapReference ??
                            link.remediationReference ??
                            "Finding"}
                        </Badge>
                      ))}
                    </TD>
                    <TD>
                      <EvidenceReviewBadge status={item.reviewStatus} />
                      {item.reviewNote ? (
                        <span className="mt-1 block max-w-52 text-xs text-content-muted">
                          {item.reviewNote}
                        </span>
                      ) : null}
                    </TD>
                    <TD className="text-sm">
                      {isExpired(item) ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          {formatDate(item.validUntil)}
                        </span>
                      ) : (
                        <span className="text-content-muted">{formatDate(item.validUntil)}</span>
                      )}
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-2">
                        {item.kind === "DOCUMENT" ? (
                          <a
                            href={`/api/evidence/${item.id}/file`}
                            className="inline-flex items-center gap-1 text-xs text-brand-700 hover:underline dark:text-brand-300"
                          >
                            <Download className="size-3.5" aria-hidden />
                            Download
                          </a>
                        ) : item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-xs text-brand-700 hover:underline dark:text-brand-300"
                          >
                            <ExternalLink className="size-3.5" aria-hidden />
                            Open
                          </a>
                        ) : null}

                        {canReview ? (
                          <EvidenceReview
                            evidenceId={item.id}
                            isPending={item.reviewStatus === "PENDING"}
                          />
                        ) : null}
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}

          {evidence ? (
            <Pagination
              page={evidence.page}
              totalPages={evidence.totalPages}
              total={evidence.total}
              buildHref={(page) => hrefWith({ page: String(page) })}
            />
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}
