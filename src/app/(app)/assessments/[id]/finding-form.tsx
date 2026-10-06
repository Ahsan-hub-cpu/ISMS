"use client";

import { Loader2, Pencil, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ComplianceBadge } from "@/components/domain/status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  COMPLIANCE_STATUS_LABELS,
  isRegisterFindingMismatch,
  suggestedFindingStatus,
  type AssessmentItem,
  type ComplianceStatus,
} from "@/modules/assessment/domain/entities";
import { patchJson, type ApiFailure } from "@/shared/api/client";

/** "Not assessed" is the starting point, never something an assessor chooses. */
type AssessableStatus = Exclude<ComplianceStatus, "NOT_ASSESSED">;

const SELECTABLE: AssessableStatus[] = [
  "COMPLIANT",
  "PARTIALLY_COMPLIANT",
  "NON_COMPLIANT",
  "NOT_APPLICABLE",
];

/** Statuses that make the platform raise a gap once the finding is saved. */
const RAISES_GAP: readonly ComplianceStatus[] = ["PARTIALLY_COMPLIANT", "NON_COMPLIANT"];

interface FindingFormProps {
  item: AssessmentItem;
  readOnly: boolean;
}

export const FindingForm = ({ item, readOnly }: FindingFormProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);

  const lockedByGap =
    item.gapStatus === "RESOLVED" || item.gapStatus === "RISK_ACCEPTED";
  const effectivelyReadOnly = readOnly || lockedByGap;

  const [form, setForm] = useState<{
    status: AssessableStatus;
    currentPractice: string;
    rationale: string;
  }>({
    status:
      item.status === "NOT_ASSESSED"
        ? suggestedFindingStatus(item.registerImplementationStatus)
        : item.status,
    currentPractice: item.currentPractice ?? "",
    rationale: item.rationale ?? "",
  });

  const open = () => {
    setFailure(null);
    setForm({
      status:
        item.status === "NOT_ASSESSED"
          ? suggestedFindingStatus(item.registerImplementationStatus)
          : item.status,
      currentPractice: item.currentPractice ?? "",
      rationale: item.rationale ?? "",
    });
    setIsOpen(true);
  };

  const mismatch = isRegisterFindingMismatch(item.registerImplementationStatus, form.status);

  const errorFor = (field: string) =>
    failure?.issues.find((issue) => issue.field === field)?.message;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setIsSaving(true);

    const outcome = await patchJson(`/api/assessment-items/${item.id}`, {
      status: form.status,
      currentPractice: form.currentPractice.trim() || undefined,
      rationale: form.rationale.trim() || undefined,
    });

    setIsSaving(false);

    if (!outcome.ok) {
      setFailure(outcome);
      return;
    }

    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <div className="flex items-start gap-3 rounded-xl border border-surface-border bg-surface-raised px-4 py-3.5 transition-colors hover:border-brand-200 dark:hover:border-brand-800">
        <span className="mt-0.5 shrink-0 rounded-lg bg-brand-50 px-2.5 py-1 font-mono text-xs font-semibold text-brand-800 ring-1 ring-inset ring-brand-100 dark:bg-brand-950/60 dark:text-brand-200 dark:ring-brand-900">
          {item.controlCode}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-content">{item.controlTitle}</span>
          <span className="mt-0.5 block text-xs text-content-subtle">{item.themeName}</span>
        </span>

        <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {item.gapReference ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-[3px] text-[0.6875rem] font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300">
              <ShieldAlert className="size-3" aria-hidden />
              {item.gapReference}
            </span>
          ) : null}
          <ComplianceBadge status={item.status} />
          <Button
            variant="secondary"
            size="sm"
            onClick={open}
            title={
              lockedByGap
                ? `Locked — ${item.gapReference ?? "gap"} is closed`
                : undefined
            }
          >
            <Pencil className="size-3.5" aria-hidden />
            {effectivelyReadOnly ? "View" : "Record"}
          </Button>
        </span>
      </div>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={`${item.controlCode} · ${item.controlTitle}`}
        description={item.controlPurpose}
        size="lg"
        footer={
          effectivelyReadOnly ? (
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form={`finding-${item.id}`} disabled={isSaving}>
                {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Save finding
              </Button>
            </>
          )
        }
      >
        {effectivelyReadOnly ? (
          <dl className="space-y-3 text-sm">
            {lockedByGap ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                Locked because {item.gapReference ?? "the gap"} is closed. Finding and register were
                updated automatically on resolve.
              </p>
            ) : null}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-content-muted">
                Finding
              </dt>
              <dd className="mt-1">
                <ComplianceBadge status={item.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-content-muted">
                Current practice
              </dt>
              <dd className="mt-1 whitespace-pre-line">{item.currentPractice ?? "Not recorded"}</dd>
            </div>
            {item.rationale ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-content-muted">
                  Rationale
                </dt>
                <dd className="mt-1 whitespace-pre-line">{item.rationale}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <form id={`finding-${item.id}`} onSubmit={handleSubmit} className="space-y-4" noValidate>
            {failure ? (
              <Alert>{failure.message}</Alert>
            ) : null}

            {item.registerImplementationLabel ? (
              <p className="rounded-xl border border-surface-border bg-surface-sunken/50 px-3 py-2 text-xs text-content-muted">
                Control register says implementation is{" "}
                <span className="font-semibold text-content">
                  {item.registerImplementationLabel}
                </span>
                . The finding below should match what is actually operating.
              </p>
            ) : null}

            {mismatch ? (
              <Alert tone="warning">
                Register is {item.registerImplementationLabel ?? "not live"}, but finding is
                Compliant. Prefer Non-compliant / Partially compliant, or explain clearly in
                rationale why practice is compliant despite the register.
              </Alert>
            ) : null}

            <Field label="Finding" htmlFor={`status-${item.id}`} error={errorFor("status")}>
              <Select
                id={`status-${item.id}`}
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as AssessableStatus,
                  }))
                }
              >
                {SELECTABLE.map((status) => (
                  <option key={status} value={status}>
                    {COMPLIANCE_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Current practice"
              htmlFor={`practice-${item.id}`}
              hint="What is actually happening today. This becomes the body of the gap record."
              error={errorFor("currentPractice")}
            >
              <Textarea
                id={`practice-${item.id}`}
                value={form.currentPractice}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currentPractice: event.target.value }))
                }
              />
            </Field>

            <Field
              label="Rationale"
              htmlFor={`rationale-${item.id}`}
              hint="Optional note on how you reached this conclusion."
            >
              <Textarea
                id={`rationale-${item.id}`}
                rows={2}
                value={form.rationale}
                onChange={(event) =>
                  setForm((current) => ({ ...current, rationale: event.target.value }))
                }
              />
            </Field>

            {RAISES_GAP.includes(form.status) ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Saving this finding raises a gap, scores its risk from the control attributes and
                schedules a remediation action.
              </p>
            ) : null}
          </form>
        )}
      </Modal>
    </>
  );
};
