"use client";

import { Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
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

  const [form, setForm] = useState({
    ownerId: entry.ownerId ?? "",
    siteId: entry.siteId ?? "",
    applicability: entry.applicability,
    justification: entry.justification ?? "",
    implementationStatus: entry.implementationStatus,
    implementationNotes: entry.implementationNotes ?? "",
    reviewDueAt: toDateInput(entry.reviewDueAt),
  });

  const errorFor = (field: string) =>
    failure?.issues.find((issue) => issue.field === field)?.message;

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

  if (!isOpen) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="surface-card my-8 w-full max-w-xl">
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">
              {entry.controlCode} {entry.controlTitle}
            </h2>
            <p className="text-sm text-content-muted">{entry.themeName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Close">
            <X className="size-4" aria-hidden />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4" noValidate>
          {failure ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              {failure.message}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Control owner" htmlFor={`owner-${entry.id}`}>
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

            <Field label="Site" htmlFor={`site-${entry.id}`} hint="Leave empty for district-wide">
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
              value={form.implementationNotes}
              onChange={(event) => update("implementationNotes")(event.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
