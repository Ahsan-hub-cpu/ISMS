"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  REMEDIATION_STATUS_LABELS,
  REMEDIATION_STATUSES,
  type RemediationAction,
} from "@/modules/remediation/domain/entities";
import { patchJson, type ApiFailure } from "@/shared/api/client";

interface ProgressFormProps {
  action: RemediationAction;
  owners: readonly { id: string; name: string }[];
  /** Owners report progress; planners can also reassign and reschedule. */
  canPlan: boolean;
}

const toDateInput = (value: Date | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

export const ProgressForm = ({ action, owners, canPlan }: ProgressFormProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);

  const locked = action.status === "COMPLETED" || action.status === "CANCELLED";
  const waitingApproval = action.status === "IN_REVIEW";
  // Owners wait; assessors/planners may still reopen or adjust while in review.
  const readOnly = locked || (waitingApproval && !canPlan);

  const [form, setForm] = useState({
    status: action.status,
    progressPercent: String(action.progressPercent),
    ownerId: action.ownerId ?? "",
    priority: action.priority,
    dueAt: toDateInput(action.dueAt),
  });

  const errorFor = (field: string) =>
    failure?.issues.find((issue) => issue.field === field)?.message;

  const setProgress = (value: string) => {
    const percent = Number(value);
    setForm((current) => ({
      ...current,
      progressPercent: value,
      // UI mirrors server rule: 100% means ready for assessor review.
      status:
        percent >= 100 && (current.status === "OPEN" || current.status === "IN_PROGRESS")
          ? "IN_REVIEW"
          : current.status,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) return;

    setFailure(null);
    setIsSaving(true);

    const outcome = await patchJson(`/api/remediation/${action.id}`, {
      status: form.status,
      progressPercent: Number(form.progressPercent),
      ...(canPlan
        ? { ownerId: form.ownerId || null, priority: form.priority, dueAt: form.dueAt || null }
        : {}),
    });

    setIsSaving(false);

    if (!outcome.ok) {
      setFailure(outcome);
      return;
    }

    router.refresh();
  };

  if (locked) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
        <p className="font-medium">
          {action.status === "COMPLETED"
            ? "This remediation is completed — editing is locked."
            : "This remediation is cancelled — editing is locked."}
        </p>
        <p className="mt-1 text-xs opacity-90">
          Evidence was accepted and the fix ticket is closed. Next step is on the linked gap:
          Assessor sets status to Resolved.
        </p>
      </div>
    );
  }

  if (waitingApproval && !canPlan) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <p className="font-medium">Waiting for approval</p>
        <p className="mt-1 text-xs opacity-90">
          You saved at 100%. Progress is locked until the Assessor Accepts your evidence. After
          Accept, this action becomes Completed automatically.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {failure ? <Alert>{failure.message}</Alert> : null}

      {waitingApproval ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <span className="font-medium">Waiting for approval.</span> Owner finished at 100%. Accept
          evidence (Evidence page) to complete this action, or reopen if more work is needed.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Status"
          htmlFor="status"
          hint={
            waitingApproval
              ? "In review = waiting for assessor approval. Prefer Accept evidence over setting Completed by hand."
              : undefined
          }
        >
          <Select
            id="status"
            value={form.status}
            disabled={readOnly}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as RemediationAction["status"],
              }))
            }
          >
            {REMEDIATION_STATUSES.filter((status) => {
              // Owners never pick Completed / Cancelled from the form.
              if (!canPlan && (status === "COMPLETED" || status === "CANCELLED")) return false;
              return true;
            }).map((status) => (
              <option key={status} value={status}>
                {REMEDIATION_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Progress %"
          htmlFor="progressPercent"
          hint="Attach evidence first. 100% is blocked until evidence exists; then status becomes Waiting for approval."
          error={errorFor("progressPercent")}
        >
          <Input
            id="progressPercent"
            type="number"
            min={0}
            max={100}
            step={5}
            disabled={readOnly}
            value={form.progressPercent}
            onChange={(event) => setProgress(event.target.value)}
          />
        </Field>

        {canPlan ? (
          <>
            <Field label="Owner" htmlFor="ownerId">
              <Select
                id="ownerId"
                value={form.ownerId}
                disabled={readOnly}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ownerId: event.target.value }))
                }
              >
                <option value="">Unassigned</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Priority" htmlFor="priority">
              <Select
                id="priority"
                value={form.priority}
                disabled={readOnly}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as RemediationAction["priority"],
                  }))
                }
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Due date" htmlFor="dueAt">
              <Input
                id="dueAt"
                type="date"
                disabled={readOnly}
                value={form.dueAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dueAt: event.target.value }))
                }
              />
            </Field>
          </>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSaving || readOnly}>
          {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Save progress
        </Button>
      </div>
    </form>
  );
};
