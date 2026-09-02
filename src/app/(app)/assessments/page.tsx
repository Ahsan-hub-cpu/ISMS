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
        title="Assessments"
        description="Each assessment walks through the applicable controls and records what is actually in place."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader title="All assessments" description="Most recent first." />

          <CardBody className="space-y-4">
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
              <ul className="divide-y">
                {assessments.items.map((assessment) => (
                  <li key={assessment.id}>
                    <Link
                      href={`/assessments/${assessment.id}`}
                      className="block rounded-lg px-2 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs text-content-muted">
                            {assessment.reference}
                          </span>
                          <p className="text-sm font-medium">{assessment.title}</p>
                        </div>
                        <AssessmentStatusBadge status={assessment.status} />
                      </div>

                      <p className="mt-1 text-xs text-content-muted">
                        {assessment.frameworkName} · started {formatDate(assessment.startedAt)} ·
                        led by {assessment.leadAssessorName}
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Progress
                          value={assessment.progress.completionPercent}
                          label={`Assessed ${assessment.progress.assessed} of ${assessment.progress.total}`}
                        />
                        <Progress
                          value={assessment.progress.compliancePercent}
                          label="Compliance"
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {assessments ? (
              <Pagination
                page={assessments.page}
                totalPages={assessments.totalPages}
                total={assessments.total}
                buildHref={(page) => hrefWith({ page: String(page) })}
              />
            ) : null}
          </CardBody>
        </Card>

        {canConduct ? (
          <Card className="h-fit">
            <CardHeader title="Start an assessment" />
            <CardBody>
              <CreateAssessmentForm
                frameworks={frameworks.map((framework) => ({
                  code: framework.code,
                  name: framework.name,
                }))}
                assessors={assessors}
                defaultAssessorId={session.id}
              />
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
