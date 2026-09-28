import { ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AssessmentStatusBadge } from "@/components/domain/status-badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Progress } from "@/components/ui/stat";
import { assessmentService } from "@/modules/assessment";
import { assessmentQuerySchema } from "@/modules/assessment/application/schemas";
import { authService } from "@/modules/auth";
import { can } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { frameworkService } from "@/modules/framework";
import { organizationService } from "@/modules/organization";
import { hrefBuilder, parseQuery, type SearchParams } from "@/shared/utils/query";

import { CreateAssessmentForm } from "./create-assessment-form";

export const metadata: Metadata = { title: "Assessments" };

const formatDate = (value: Date) =>
  new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" });

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requirePermission("assessments:read");
  const organizationId = await organizationService.currentId();
  const rawParams = await searchParams;
  const query = parseQuery(assessmentQuerySchema, rawParams);

  const [assessmentsResult, frameworksResult, usersResult] = await Promise.all([
    assessmentService.list(organizationId, query),
    frameworkService.listFrameworks(),
    authService.listUsers(),
  ]);

  const assessments = assessmentsResult.ok ? assessmentsResult.value : null;
  const frameworks = frameworksResult.ok ? frameworksResult.value : [];
  const assessors = usersResult.ok
    ? usersResult.value
        .filter((user) => user.isActive && can(user.role, "assessments:conduct"))
        .map((user) => ({ id: user.id, name: user.fullName }))
    : [];

  const canConduct = can(session.role, "assessments:conduct");
  const hrefWith = hrefBuilder("/assessments", rawParams);

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="Assessments"
        description="Each assessment walks through the applicable controls and records what is actually in place."
        actions={
          canConduct ? (
            <CreateAssessmentForm
              frameworks={frameworks.map((framework) => ({
                code: framework.code,
                name: framework.name,
              }))}
              assessors={assessors}
              defaultAssessorId={session.id}
            />
          ) : null
        }
      />

      <Card>
        <CardHeader
          icon={ClipboardCheck}
          title="All assessments"
          description="Most recent first."
        />

        <CardBody className="p-0">
          {!assessments || assessments.items.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No assessment yet"
              description={
                canConduct
                  ? "Start one and the checklist of applicable controls is built for you."
                  : "An assessor needs to start the first assessment."
              }
            />
          ) : (
            <ul className="divide-y divide-surface-border">
              {assessments.items.map((assessment) => (
                <li key={assessment.id}>
                  <Link
                    href={`/assessments/${assessment.id}`}
                    className="block px-5 py-4 transition-colors hover:bg-brand-50/50 dark:hover:bg-brand-950/25"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-content-subtle">
                          {assessment.reference}
                        </span>
                        <p className="font-display text-[0.9375rem] font-semibold tracking-tight text-content">
                          {assessment.title}
                        </p>
                      </div>
                      <AssessmentStatusBadge status={assessment.status} />
                    </div>

                    <p className="mt-1 text-xs text-content-muted">
                      {assessment.frameworkName} · started {formatDate(assessment.startedAt)} · led
                      by {assessment.leadAssessorName}
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-6">
                      <Progress
                        value={assessment.progress.completionPercent}
                        label={`Assessed ${assessment.progress.assessed} of ${assessment.progress.total}`}
                      />
                      <Progress value={assessment.progress.compliancePercent} label="Compliance" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {assessments ? (
            <div className="px-5 pb-4 pt-1">
              <Pagination
                page={assessments.page}
                totalPages={assessments.totalPages}
                total={assessments.total}
                buildHref={(page) => hrefWith({ page: String(page) })}
              />
            </div>
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}
