"use client";

import { Loader2, Paperclip, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { EVIDENCE_KIND_LABELS, EVIDENCE_KINDS } from "@/modules/evidence/domain/entities";
import { apiRequest, type ApiFailure } from "@/shared/api/client";

export interface EvidenceTargetProps {
  controlId?: string;
  assessmentItemId?: string;
  gapId?: string;
  remediationId?: string;
}

interface EvidenceUploaderProps {
  target: EvidenceTargetProps;
  /** Collapses into a single button until the user chooses to attach something. */
  compact?: boolean;
}

const EMPTY = {
  title: "",
  description: "",
  kind: "DOCUMENT" as (typeof EVIDENCE_KINDS)[number],
  url: "",
  validUntil: "",
};

export const EvidenceUploader = ({ target, compact = false }: EvidenceUploaderProps) => {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(!compact);
  const [isSaving, setIsSaving] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [form, setForm] = useState(EMPTY);

  const errorFor = (field: string) =>
    failure?.issues.find((issue) => issue.field === field)?.message;

  const update = (field: keyof typeof EMPTY) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setIsSaving(true);

    // Multipart keeps the file and its metadata in one request.
    const body = new FormData();
    body.set("title", form.title);
    if (form.description) body.set("description", form.description);
    body.set("kind", form.kind);
    if (form.kind === "LINK") body.set("url", form.url);
    if (form.validUntil) body.set("validUntil", form.validUntil);

    for (const [key, value] of Object.entries(target)) {
      if (value) body.set(key, value);
    }

    const file = fileRef.current?.files?.[0];
    if (file) body.set("file", file);

    const outcome = await apiRequest("/api/evidence", { method: "POST", body });
    setIsSaving(false);

    if (!outcome.ok) {
      setFailure(outcome);
      return;
    }

    setForm(EMPTY);
    if (fileRef.current) fileRef.current.value = "";
    if (compact) setIsOpen(false);
    router.refresh();
  };

  if (!isOpen) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
        <Paperclip className="size-3.5" aria-hidden />
        Attach evidence
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t pt-3" noValidate>
      {failure ? (
        <Alert>{failure.message}</Alert>
      ) : null}

      <Field label="Title" htmlFor="evidenceTitle" error={errorFor("title")}>
        <Input
          id="evidenceTitle"
          required
          value={form.title}
          onChange={(event) => update("title")(event.target.value)}
        />
      </Field>

      <Field label="Type" htmlFor="evidenceKind">
        <Select
          id="evidenceKind"
          value={form.kind}
          onChange={(event) => update("kind")(event.target.value)}
        >
          {EVIDENCE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {EVIDENCE_KIND_LABELS[kind]}
            </option>
          ))}
        </Select>
      </Field>

      {form.kind === "DOCUMENT" ? (
        <Field
          label="File"
          htmlFor="evidenceFile"
          hint="PDF, Office document, text file or image up to 15 MB."
          error={errorFor("file")}
        >
          <Input
            id="evidenceFile"
            type="file"
            ref={fileRef}
            className="h-auto py-2 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-800 dark:file:bg-brand-950/70 dark:file:text-brand-200"
          />
        </Field>
      ) : (
        <Field label="URL" htmlFor="evidenceUrl" error={errorFor("url")}>
          <Input
            id="evidenceUrl"
            type="url"
            required
            placeholder="https://"
            value={form.url}
            onChange={(event) => update("url")(event.target.value)}
          />
        </Field>
      )}

      <Field
        label="Valid until"
        htmlFor="evidenceValidUntil"
        hint="Optional. Policies and certificates go stale, so the dashboard flags expired evidence."
      >
        <Input
          id="evidenceValidUntil"
          type="date"
          value={form.validUntil}
          onChange={(event) => update("validUntil")(event.target.value)}
        />
      </Field>

      <Field label="Notes" htmlFor="evidenceDescription" hint="Optional">
        <Textarea
          id="evidenceDescription"
          rows={2}
          value={form.description}
          onChange={(event) => update("description")(event.target.value)}
        />
      </Field>

      <div className="flex justify-end gap-2">
        {compact ? (
          <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-4" aria-hidden />
          )}
          Add evidence
        </Button>
      </div>
    </form>
  );
};
