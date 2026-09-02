"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

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
  const [failure, setFailure] = useState<ApiFailure | null>(null);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setIsSaving(true);

    const outcome = await patchJson(`/api/gaps/${gap.id}`, form);
    setIsSaving(false);

    if (!outcome.ok) {
      setFailure(outcome);
      return;
    }

    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {failure ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {failure.message}
        </p>
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
      ) : (
        <p className="text-xs text-content-muted">
          Verification is complete, so this gap can be resolved.
        </p>
      )}

      <p className="text-xs text-content-muted">
        Reassessing the control as compliant moves the gap to Awaiting review, never straight to
        Resolved. Closing it is an assessor decision and is recorded in the audit log.
      </p>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Save decision
        </Button>
      </div>
    </form>
  );
};
