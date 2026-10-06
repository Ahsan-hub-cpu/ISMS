"use client";

import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import {
  GAP_STATUS_HINTS,
  GAP_STATUS_LABELS,
  GAP_TRANSITIONS,
  type Gap,
} from "@/modules/gap/domain/entities";
import { RISK_LABELS, RISK_RATINGS } from "@/modules/gap/domain/risk";
import { patchJson, type ApiFailure } from "@/shared/api/client";

export const GapDecisionForm = ({
  gap,
  closureBlockers,
}: {
  gap: Gap;
  closureBlockers: readonly string[];
}) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);

  const closed = gap.status === "RESOLVED" || gap.status === "RISK_ACCEPTED";
  const canResolveNow =
    gap.status === "AWAITING_REVIEW" && closureBlockers.length === 0 && !closed;

  const [form, setForm] = useState({
    description: gap.description,
    recommendation: gap.recommendation,
    riskRating: gap.riskRating,
    status: gap.status,
  });

  const errorFor = (field: string) =>
    failure?.issues.find((issue) => issue.field === field)?.message;

  // The domain decides which moves are legal; the form only offers those, and
  // the API checks them again on every request.
  const allowedStatuses = [gap.status, ...GAP_TRANSITIONS[gap.status]];

  const save = async (payload: typeof form) => {
    setFailure(null);
    const outcome = await patchJson(`/api/gaps/${gap.id}`, payload);
    if (!outcome.ok) {
      setFailure(outcome);
      return false;
    }
    router.refresh();
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (closed) return;
    setIsSaving(true);
    await save(form);
    setIsSaving(false);
  };

  const handleResolve = async () => {
    if (!canResolveNow) return;
    setIsResolving(true);
    setForm((current) => ({ ...current, status: "RESOLVED" }));
    await save({ ...form, status: "RESOLVED" });
    setIsResolving(false);
  };

  if (closed) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
        <p className="font-medium">
          {gap.status === "RESOLVED"
            ? "Gap resolved — decision is locked."
            : "Risk accepted — decision is locked."}
        </p>
        <p className="mt-1 text-xs opacity-90">
          This gap is closed. Further changes require reopening from an allowed transition.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {failure ? <Alert>{failure.message}</Alert> : null}

      {canResolveNow ? (
        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            Ready to close. Remediation is done and evidence is accepted.
          </p>
          <p className="text-xs text-emerald-800 dark:text-emerald-200">
            Click <strong>Mark as Resolved</strong> — the finding becomes Compliant and the
            register becomes Implemented automatically. Both then lock for editing.
          </p>
          <Button
            type="button"
            size="sm"
            disabled={isResolving || isSaving}
            onClick={handleResolve}
          >
            {isResolving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden />
            )}
            Mark as Resolved
          </Button>
        </div>
      ) : null}

      <Field
        label="Gap description"
        htmlFor="description"
        hint={
          gap.descriptionEditedAt
            ? "You have edited this description. The system draft is kept below for comparison."
            : "Drafted from the control purpose and the practice recorded during the assessment. Edit it to describe what your organisation actually found."
        }
        error={errorFor("description")}
      >
        <Textarea
          id="description"
          rows={5}
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
        />
      </Field>

      {gap.descriptionEditedAt && gap.generatedDescription !== form.description ? (
        <details className="rounded-lg border px-3 py-2 text-xs text-content-muted">
          <summary className="cursor-pointer font-medium">Show the original draft</summary>
          <p className="mt-2 whitespace-pre-line">{gap.generatedDescription}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() =>
              setForm((current) => ({ ...current, description: gap.generatedDescription }))
            }
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Restore draft
          </Button>
        </details>
      ) : null}

      <Field
        label="Recommendation"
        htmlFor="recommendation"
        hint="Drafted automatically from the control. Refine it if the organisation has a specific plan."
        error={errorFor("recommendation")}
      >
        <Textarea
          id="recommendation"
          value={form.recommendation}
          onChange={(event) =>
            setForm((current) => ({ ...current, recommendation: event.target.value }))
          }
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Risk rating"
          htmlFor="riskRating"
          hint={
            gap.riskRatingOverridden
              ? `Overridden by hand. The model calculated ${RISK_LABELS[gap.riskRating]} at ${gap.riskScore}/${gap.riskMaximumScore}.`
              : "Only override the calculated rating if you can justify it."
          }
        >
          <Select
            id="riskRating"
            value={form.riskRating}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                riskRating: event.target.value as Gap["riskRating"],
              }))
            }
          >
            {RISK_RATINGS.map((rating) => (
              <option key={rating} value={rating}>
                {RISK_LABELS[rating]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" htmlFor="status" hint={GAP_STATUS_HINTS[form.status]}>
          <Select
            id="status"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value as Gap["status"] }))
            }
          >
            {allowedStatuses.map((status) => (
              <option key={status} value={status}>
                {GAP_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {closureBlockers.length > 0 ? (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">Before this gap can be resolved:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {closureBlockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      ) : gap.status !== "AWAITING_REVIEW" ? (
        <p className="text-xs text-content-muted">
          Set status to <strong>Awaiting review</strong> first. Then you can mark the gap Resolved.
        </p>
      ) : null}

      <p className="text-xs text-content-muted">
        Closing a gap is an assessor decision and is recorded in the audit log. Risk accepted is
        only for when management accepts the exposure instead of fixing it.
      </p>

      <div className="flex justify-end gap-2">
        <Button type="submit" size="sm" variant="secondary" disabled={isSaving || isResolving}>
          {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Save decision
        </Button>
      </div>
    </form>
  );
};
