import type { AuditDraft } from "@/modules/audit";
import { NotFoundError, ValidationError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { Assessment } from "../../domain/entities";
import type { AssessmentRepository } from "../ports/assessment-repository";
import type { CreateAssessmentInput } from "../schemas";

interface Dependencies {
  readonly assessments: AssessmentRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
  readonly findFrameworkByCode: (code: string) => Promise<{ id: string; name: string } | null>;
  /** Controls the register says are in scope, and the register top-up before that. */
  readonly prepareScope: (
    organizationId: string,
    frameworkId: string,
  ) => Promise<readonly string[]>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly organizationId: string;
  readonly input: CreateAssessmentInput;
}

/**
 * Starts an assessment and lays out a checklist covering every applicable
 * control, so the assessor never has to add controls one at a time.
 */
export const createAssessment =
  ({ assessments, audit, findFrameworkByCode, prepareScope }: Dependencies) =>
  async ({ actor, organizationId, input }: Command): Promise<Result<Assessment>> => {
    const framework = await findFrameworkByCode(input.frameworkCode);
    if (!framework) {
      return failure(new NotFoundError("Framework", input.frameworkCode));
    }

    const controlIds = await prepareScope(organizationId, framework.id);
    if (controlIds.length === 0) {
      return failure(
        new ValidationError(
          "Every control in this framework is currently marked as not applicable, so there is nothing to assess.",
        ),
      );
    }

    const assessment = await assessments.create(
      {
        organizationId,
        frameworkId: framework.id,
        reference: await assessments.nextReference(organizationId),
        title: input.title,
        scope: input.scope,
        leadAssessorId: input.leadAssessorId,
      },
      controlIds,
    );

    await audit({
      actor,
      action: "CREATE",
      entityType: "Assessment",
      entityId: assessment.id,
      summary: `${assessment.reference} started against ${framework.name} covering ${controlIds.length} controls`,
    });

    return success(assessment);
  };
