import { auditService } from "@/modules/audit";
import { frameworkService } from "@/modules/framework";
import { gapService } from "@/modules/gap";
import { registerService } from "@/modules/register";
import { success, type Result } from "@/shared/core/result";
import type { Paginated } from "@/shared/core/pagination";

import { changeAssessmentStatus } from "./application/use-cases/change-assessment-status";
import { createAssessment } from "./application/use-cases/create-assessment";
import { recordFinding } from "./application/use-cases/record-finding";
import type { AssessmentItemQuery, AssessmentQuery } from "./application/schemas";
import type { Assessment, AssessmentItem } from "./domain/entities";
import { prismaAssessmentRepository } from "./infrastructure/prisma-assessment-repository";

/**
 * Tops the register up with any new catalogue controls, then returns the ones
 * that are in scope. A new assessment therefore always covers the current
 * catalogue without anyone maintaining a list by hand.
 */
const prepareScope = async (organizationId: string, frameworkId: string) => {
  await registerService.synchronise({ actor: null, organizationId, frameworkId });
  return registerService.listApplicableControlIds(organizationId, frameworkId);
};

const dependencies = {
  assessments: prismaAssessmentRepository,
  audit: auditService.record,
  synchroniseGap: gapService.synchronise,
  findFrameworkByCode: frameworkService.findByCode,
  prepareScope,
};

/** Composition root for the assessment module. */
export const assessmentService = {
  list: async (
    organizationId: string,
    query: AssessmentQuery,
  ): Promise<Result<Paginated<Assessment>>> =>
    success(await prismaAssessmentRepository.list(organizationId, query)),

  findById: (id: string) => prismaAssessmentRepository.findById(id),

  listItems: async (
    assessmentId: string,
    query: AssessmentItemQuery,
  ): Promise<Result<Paginated<AssessmentItem>>> =>
    success(await prismaAssessmentRepository.listItems(assessmentId, query)),

  create: createAssessment(dependencies),
  recordFinding: recordFinding(dependencies),
  changeStatus: changeAssessmentStatus(dependencies),
};

export type {
  Assessment,
  AssessmentItem,
  AssessmentStatus,
  ComplianceStatus,
} from "./domain/entities";
export {
  ASSESSMENT_STATUS_LABELS,
  ASSESSMENT_STATUSES,
  COMPLIANCE_STATUS_LABELS,
  COMPLIANCE_STATUSES,
  isEditable,
} from "./domain/entities";
export {
  COMPLIANCE_FORMULA_NOTE,
  compliancePercentOf,
  scoreCompliance,
} from "./domain/scoring";
export type { ComplianceScore } from "./domain/scoring";
