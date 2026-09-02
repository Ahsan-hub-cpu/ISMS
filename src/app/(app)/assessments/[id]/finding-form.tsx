"use client";

import { ChevronDown, Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ComplianceBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import {
  COMPLIANCE_STATUS_LABELS,
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

  const [form, setForm] = useState<{
    status: AssessableStatus;
    currentPractice: string;
    rationale: string;
  }>({
    status: item.status === "NOT_ASSESSED" ? "COMPLIANT" : item.status,
    currentPractice: item.currentPractice ?? "",
    rationale: item.rationale ?? "",
  });

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
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
        aria-expanded={isOpen}
      >
        <span className="mt-0.5 shrink-0 rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-medium dark:bg-slate-800">
          {item.controlCode}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{item.controlTitle}</span>
          <span className="mt-0.5 block text-xs text-content-muted">{item.themeName}</span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {item.gapReference ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              <ShieldAlert className="size-3" aria-hidden />
              {item.gapReference}
            </span>
          ) : null}
          <ComplianceBadge status={item.status} />
          <ChevronDown
            className={`size-4 text-content-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </span>
      </button>

      {isOpen ? (
        <div className="border-t px-4 py-4">
          <p className="mb-4 text-sm text-content-muted">{item.controlPurpose}</p>

          {readOnly ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-content-muted">
                  Current practice
                </dt>
                <dd>{item.currentPractice ?? "Not recorded"}</dd>
              </div>
              {item.rationale ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-content-muted">
                    Rationale
                  </dt>
                  <dd>{item.rationale}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {failure ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  {failure.message}
                </p>
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
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Saving this finding raises a gap, scores its risk from the control attributes and
                  schedules a remediation action.
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Save finding
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
};
