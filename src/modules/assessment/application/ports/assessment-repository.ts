import type { Paginated } from "@/shared/core/pagination";

import type {
  Assessment,
  AssessmentItem,
  AssessmentStatus,
  ComplianceStatus,
} from "../../domain/entities";
import type { AssessmentItemQuery, AssessmentQuery, RecordFindingInput } from "../schemas";

export interface NewAssessment {
  readonly organizationId: string;
  readonly frameworkId: string;
  readonly reference: string;
  readonly title: string;
  readonly scope: string;
  readonly leadAssessorId: string;
}

export interface AssessmentRepository {
  nextReference(organizationId: string): Promise<string>;
  create(data: NewAssessment, controlIds: readonly string[]): Promise<Assessment>;
  list(organizationId: string, query: AssessmentQuery): Promise<Paginated<Assessment>>;
  findById(id: string): Promise<Assessment | null>;
  listItems(assessmentId: string, query: AssessmentItemQuery): Promise<Paginated<AssessmentItem>>;
  findItem(itemId: string): Promise<(AssessmentItem & { assessmentStatus: AssessmentStatus }) | null>;
  recordFinding(
    itemId: string,
    input: RecordFindingInput & { status: ComplianceStatus },
    assessorId: string,
  ): Promise<AssessmentItem>;
  setStatus(id: string, status: AssessmentStatus, actorId: string | null): Promise<Assessment>;
  countUnassessed(assessmentId: string): Promise<number>;
}
