"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

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

  const [form, setForm] = useState({
    status: action.status,
    progressPercent: String(action.progressPercent),
    ownerId: action.ownerId ?? "",
    priority: action.priority,
    dueAt: toDateInput(action.dueAt),
  });

  const errorFor = (field: string) =>
    failure?.issues.find((issue) => issue.field === field)?.message;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {failure ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {failure.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor="status">
          <Select
            id="status"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as RemediationAction["status"],
              }))
            }
          >
            {REMEDIATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {REMEDIATION_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Progress"
          htmlFor="progressPercent"
          hint="Marking the action completed sets this to 100%."
          error={errorFor("progressPercent")}
        >
          <Input
            id="progressPercent"
            type="number"
            min={0}
            max={100}
            step={5}
            value={form.progressPercent}
            onChange={(event) =>
              setForm((current) => ({ ...current, progressPercent: event.target.value }))
            }
          />
        </Field>

        {canPlan ? (
          <>
            <Field label="Owner" htmlFor="ownerId">
              <Select
                id="ownerId"
                value={form.ownerId}
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
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Save progress
        </Button>
      </div>
    </form>
  );
};
