import {
  ASSESSMENT_STATUS_LABELS,
  COMPLIANCE_STATUS_LABELS,
  type AssessmentStatus,
  type ComplianceStatus,
} from "@/modules/assessment/domain/entities";
import { EVIDENCE_REVIEW_LABELS } from "@/modules/evidence/domain/entities";
import { GAP_STATUS_LABELS, type GapStatus } from "@/modules/gap/domain/entities";
import { RISK_LABELS, type RiskRating } from "@/modules/gap/domain/risk";
import {
  IMPLEMENTATION_LABELS,
  type ImplementationStatus,
} from "@/modules/register/domain/entities";
import {
  PRIORITY_LABELS,
  REMEDIATION_STATUS_LABELS,
  type Priority,
  type RemediationStatus,
} from "@/modules/remediation/domain/entities";
import { Badge, type BadgeTone } from "@/components/ui/badge";

/**
 * One place that decides how each status looks, so the same state never appears
 * in two different colours across the application. Everything here comes from
 * the domain layer so client components never pull in server-only code.
 */
const COMPLIANCE_TONES: Record<ComplianceStatus, BadgeTone> = {
  NOT_ASSESSED: "neutral",
  COMPLIANT: "success",
  PARTIALLY_COMPLIANT: "warning",
  NON_COMPLIANT: "danger",
  NOT_APPLICABLE: "neutral",
};

const RISK_TONES: Record<RiskRating, BadgeTone> = {
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "danger",
  CRITICAL: "danger",
};

const GAP_TONES: Record<GapStatus, BadgeTone> = {
  OPEN: "danger",
  IN_PROGRESS: "brand",
  AWAITING_REVIEW: "warning",
  RESOLVED: "success",
  RISK_ACCEPTED: "neutral",
};

const IMPLEMENTATION_TONES: Record<ImplementationStatus, BadgeTone> = {
  NOT_IMPLEMENTED: "danger",
  PLANNED: "neutral",
  PARTIALLY_IMPLEMENTED: "warning",
  IMPLEMENTED: "success",
};

const ASSESSMENT_TONES: Record<AssessmentStatus, BadgeTone> = {
  DRAFT: "neutral",
  IN_PROGRESS: "brand",
  SUBMITTED: "warning",
  APPROVED: "success",
};

const REMEDIATION_TONES: Record<RemediationStatus, BadgeTone> = {
  OPEN: "danger",
  IN_PROGRESS: "brand",
  IN_REVIEW: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

const PRIORITY_TONES: Record<Priority, BadgeTone> = {
  LOW: "neutral",
  MEDIUM: "brand",
  HIGH: "warning",
  CRITICAL: "danger",
};

const EVIDENCE_TONES: Record<keyof typeof EVIDENCE_REVIEW_LABELS, BadgeTone> = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
};

export const ComplianceBadge = ({ status }: { status: ComplianceStatus }) => (
  <Badge tone={COMPLIANCE_TONES[status]} dot>
    {COMPLIANCE_STATUS_LABELS[status]}
  </Badge>
);

export const RiskBadge = ({ rating }: { rating: RiskRating }) => (
  <Badge tone={RISK_TONES[rating]} dot>
    {RISK_LABELS[rating]}
  </Badge>
);

export const GapStatusBadge = ({ status }: { status: GapStatus }) => (
  <Badge tone={GAP_TONES[status]} dot>
    {GAP_STATUS_LABELS[status]}
  </Badge>
);

export const ImplementationBadge = ({ status }: { status: ImplementationStatus }) => (
  <Badge tone={IMPLEMENTATION_TONES[status]} dot>
    {IMPLEMENTATION_LABELS[status]}
  </Badge>
);

export const AssessmentStatusBadge = ({ status }: { status: AssessmentStatus }) => (
  <Badge tone={ASSESSMENT_TONES[status]} dot>
    {ASSESSMENT_STATUS_LABELS[status]}
  </Badge>
);

export const RemediationStatusBadge = ({ status }: { status: RemediationStatus }) => (
  <Badge tone={REMEDIATION_TONES[status]} dot>
    {REMEDIATION_STATUS_LABELS[status]}
  </Badge>
);

export const PriorityBadge = ({ priority }: { priority: Priority }) => (
  <Badge tone={PRIORITY_TONES[priority]}>{PRIORITY_LABELS[priority]}</Badge>
);

export const EvidenceReviewBadge = ({
  status,
}: {
  status: keyof typeof EVIDENCE_REVIEW_LABELS;
}) => (
  <Badge tone={EVIDENCE_TONES[status]} dot>
    {EVIDENCE_REVIEW_LABELS[status]}
  </Badge>
);
