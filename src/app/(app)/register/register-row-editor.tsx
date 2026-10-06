"use client";

import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  APPLICABILITIES,
  APPLICABILITY_LABELS,
  IMPLEMENTATION_LABELS,
  IMPLEMENTATION_STATUSES,
  type RegisterEntry,
} from "@/modules/register/domain/entities";
import { patchJson, type ApiFailure } from "@/shared/api/client";

export interface PersonOption {
  id: string;
  name: string;
}

interface RegisterRowEditorProps {
  entry: RegisterEntry;
  owners: readonly PersonOption[];
  sites: readonly PersonOption[];
}

const toDateInput = (value: Date | string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

export const RegisterRowEditor = ({ entry, owners, sites }: RegisterRowEditorProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const locked = entry.closureLocked;

  const [form, setForm] = useState({
    ownerId: entry.ownerId ?? "",
    siteId: entry.siteId ?? "",
    applicability: entry.applicability,
    justification: entry.justification ?? "",
    implementationStatus: entry.implementationStatus,
    implementationNotes: entry.implementationNotes ?? "",
    reviewDueAt: toDateInput(entry.reviewDueAt),
  });

  const open = () => {
    setFailure(null);
    setForm({
      ownerId: entry.ownerId ?? "",
      siteId: entry.siteId ?? "",
      applicability: entry.applicability,
      justification: entry.justification ?? "",
      implementationStatus: entry.implementationStatus,
      implementationNotes: entry.implementationNotes ?? "",
      reviewDueAt: toDateInput(entry.reviewDueAt),
    });
    setIsOpen(true);
  };

  const errorFor = (field: string) =>
    failure?.issues.find((issue) => issue.field === field)?.message;

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked) return;
    setFailure(null);
    setIsSaving(true);

    const outcome = await patchJson(`/api/register/${entry.id}`, {
      ownerId: form.ownerId || null,
      siteId: form.siteId || null,
      applicability: form.applicability,
      justification: form.justification.trim() || null,
      implementationStatus: form.implementationStatus,
      implementationNotes: form.implementationNotes.trim() || null,
      reviewDueAt: form.reviewDueAt || null,
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
      <Button
        variant="secondary"
        size="sm"
        onClick={open}
        disabled={locked}
        title={
          locked
            ? "Locked — gap resolved and control marked Implemented"
            : undefined
        }
      >
        <Pencil className="size-3.5" aria-hidden />
        {locked ? "Locked" : "Edit"}
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={`${entry.controlCode} · ${entry.controlTitle}`}
        description={entry.themeName}
        size="lg"
        footer={
          locked ? (
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form={`register-edit-${entry.id}`} disabled={isSaving}>
                {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Save changes
              </Button>
            </>
          )
        }
      >
        {locked ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            This control is locked because its gap was resolved. Implementation is{" "}
            <strong>Implemented</strong>. Reopen the gap if it must change again.
          </p>
        ) : null}
        <form id={`register-edit-${entry.id}`} onSubmit={handleSubmit} className="space-y-4" noValidate>
          {failure ? (
            <Alert>{failure.message}</Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Control owner"
              htmlFor={`owner-${entry.id}`}
              hint="Only users with the Control Owner role"
            >
              <Select
                id={`owner-${entry.id}`}
                value={form.ownerId}
                onChange={(event) => update("ownerId")(event.target.value)}
              >
                <option value="">Unassigned</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Site" htmlFor={`site-${entry.id}`} hint="Leave empty for organisation-wide">
              <Select
                id={`site-${entry.id}`}
                value={form.siteId}
                onChange={(event) => update("siteId")(event.target.value)}
              >
                <option value="">All sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Applicability" htmlFor={`applicability-${entry.id}`}>
              <Select
                id={`applicability-${entry.id}`}
                value={form.applicability}
                onChange={(event) => update("applicability")(event.target.value)}
              >
                {APPLICABILITIES.map((value) => (
                  <option key={value} value={value}>
                    {APPLICABILITY_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Review due" htmlFor={`review-${entry.id}`}>
              <Input
                id={`review-${entry.id}`}
                type="date"
                value={form.reviewDueAt}
                onChange={(event) => update("reviewDueAt")(event.target.value)}
              />
            </Field>
          </div>

          {form.applicability === "NOT_APPLICABLE" ? (
            <Field
              label="Justification for exclusion"
              htmlFor={`justification-${entry.id}`}
              hint="An auditor will read this, so be specific."
              error={errorFor("justification")}
            >
              <Textarea
                id={`justification-${entry.id}`}
                value={form.justification}
                onChange={(event) => update("justification")(event.target.value)}
              />
            </Field>
          ) : (
            <Field label="Implementation status" htmlFor={`status-${entry.id}`}>
              <Select
                id={`status-${entry.id}`}
                value={form.implementationStatus}
                onChange={(event) => update("implementationStatus")(event.target.value)}
              >
                {IMPLEMENTATION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {IMPLEMENTATION_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field
            label="Implementation notes"
            htmlFor={`notes-${entry.id}`}
            hint="How the control works here in practice."
          >
            <Textarea
              id={`notes-${entry.id}`}
              rows={5}
              value={form.implementationNotes}
              onChange={(event) => update("implementationNotes")(event.target.value)}
              placeholder="e.g. Roles are listed in the HR handbook; quarterly access reviews are not yet running."
            />
          </Field>
        </form>
      </Modal>
    </>
  );
};
