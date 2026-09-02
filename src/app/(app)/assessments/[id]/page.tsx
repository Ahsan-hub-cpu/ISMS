import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AssessmentStatusBadge } from "@/components/domain/status-badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Progress, Stat } from "@/components/ui/stat";
import {
  COMPLIANCE_STATUS_LABELS,
  assessmentService,
  isEditable,
} from "@/modules/assessment";
import { assessmentItemQuerySchema } from "@/modules/assessment/application/schemas";
import { can } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { frameworkService } from "@/modules/framework";
import { hrefBuilder, parseQuery, type SearchParams } from "@/shared/utils/query";

import { AssessmentActions } from "./assessment-actions";
import { FindingForm } from "./finding-form";

export const metadata: Metadata = { title: "Assessment" };

export default async function AssessmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await requirePermission("assessments:read");
  const { id } = await params;
  const rawParams = await searchParams;
  const query = parseQuery(assessmentItemQuerySchema, rawParams);

  const assessment = await assessmentService.findById(id);
  if (!assessment) notFound();

  const [itemsResult, catalogueResult] = await Promise.all([
    assessmentService.listItems(id, query),
    frameworkService.getCatalogue(assessment.frameworkCode),
  ]);

  const items = itemsResult.ok ? itemsResult.value : null;
  const themes = catalogueResult.ok ? catalogueResult.value.themes : [];

  const readOnly = !isEditable(assessment.status) || !can(session.role, "assessments:conduct");
  const hrefWith = hrefBuilder(`/assessments/${id}`, rawParams);
  const { progress } = assessment;

  return (
    <>
      <PageHeader
        title={assessment.title}
        description={`${assessment.reference} · ${assessment.frameworkName} · led by ${assessment.leadAssessorName}`}
        actions={
          <div className="flex items-center gap-3">
            <AssessmentStatusBadge status={assessment.status} />
            <AssessmentActions
              assessmentId={assessment.id}
              status={assessment.status}
              canConduct={can(session.role, "assessments:conduct")}
              canApprove={can(session.role, "assessments:approve")}
            />
          </div>
        }
      />

      <Card>
        <CardBody className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-content-muted">Scope</p>
          <p className="text-sm">{assessment.scope}</p>
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Compliant" value={progress.byStatus.COMPLIANT} tone="success" />
        <Stat label="Partially compliant" value={progress.byStatus.PARTIALLY_COMPLIANT} tone="warning" />
        <Stat label="Non-compliant" value={progress.byStatus.NON_COMPLIANT} tone="danger" />
        <Stat
          label="Still to assess"
          value={progress.byStatus.NOT_ASSESSED}
          hint={`${progress.byStatus.NOT_APPLICABLE} marked not applicable`}
        />
      </div>

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Progress
            value={progress.completionPercent}
            label={`Assessed ${progress.assessed} of ${progress.total} controls`}
          />
          <Progress value={progress.compliancePercent} label="Compliance across assessed controls" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Controls"
          description={
            readOnly
              ? "This assessment is locked. Findings are shown as recorded."
              : "Record what is in place for each control. Gaps, risk ratings and remediation actions follow automatically."
          }
        />

        <CardBody className="space-y-4">
          <FilterBar
            searchPlaceholder="Search by control code or title…"
            filters={[
              {
                key: "themeCode",
                label: "All themes",
                className: "h-10 w-56",
                options: themes.map((theme) => ({
                  value: theme.code,
                  label: `${theme.code} ${theme.name}`,
                })),
              },
              {
                key: "status",
                label: "Any finding",
                options: Object.entries(COMPLIANCE_STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              },
            ]}
          />

          {!items || items.items.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No control matches these filters"
              description="Clear the filters to see the full checklist."
            />
          ) : (
            <div className="space-y-2">
              {items.items.map((item) => (
                <FindingForm key={item.id} item={item} readOnly={readOnly} />
              ))}
            </div>
          )}

          {items ? (
            <Pagination
              page={items.page}
              totalPages={items.totalPages}
              total={items.total}
              buildHref={(page) => hrefWith({ page: String(page) })}
            />
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}
