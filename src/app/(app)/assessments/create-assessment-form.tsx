"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { postJson, type ApiFailure } from "@/shared/api/client";

interface Option {
  id: string;
  name: string;
}

interface CreateAssessmentFormProps {
  frameworks: readonly { code: string; name: string }[];
  assessors: readonly Option[];
  defaultAssessorId: string;
}

export const CreateAssessmentForm = ({
  frameworks,
  assessors,
  defaultAssessorId,
}: CreateAssessmentFormProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);

  const [form, setForm] = useState({
    title: `ISMS gap analysis ${new Date().getFullYear()}`,
    scope: "",
    frameworkCode: frameworks[0]?.code ?? "",
    leadAssessorId: defaultAssessorId,
  });

  const errorFor = (field: string) =>
    failure?.issues.find((issue) => issue.field === field)?.message;

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setIsSaving(true);

    const outcome = await postJson<{ id: string }>("/api/assessments", form);
    setIsSaving(false);

    if (!outcome.ok) {
      setFailure(outcome);
      return;
    }

    router.push(`/assessments/${outcome.data.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {failure ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {failure.message}
        </p>
      ) : null}

      <Field label="Title" htmlFor="title" error={errorFor("title")}>
        <Input
          id="title"
          required
          value={form.title}
          onChange={(event) => update("title")(event.target.value)}
        />
      </Field>

      <Field
        label="Scope"
        htmlFor="scope"
        hint="Which sites, systems and services this assessment covers."
        error={errorFor("scope")}
      >
        <Textarea
          id="scope"
          required
          value={form.scope}
          onChange={(event) => update("scope")(event.target.value)}
        />
      </Field>

      <Field label="Framework" htmlFor="frameworkCode" error={errorFor("frameworkCode")}>
        <Select
          id="frameworkCode"
          value={form.frameworkCode}
          onChange={(event) => update("frameworkCode")(event.target.value)}
        >
          {frameworks.map((framework) => (
            <option key={framework.code} value={framework.code}>
              {framework.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Lead assessor" htmlFor="leadAssessorId" error={errorFor("leadAssessorId")}>
        <Select
          id="leadAssessorId"
          value={form.leadAssessorId}
          onChange={(event) => update("leadAssessorId")(event.target.value)}
        >
          {assessors.map((assessor) => (
            <option key={assessor.id} value={assessor.id}>
              {assessor.name}
            </option>
          ))}
        </Select>
      </Field>

      <p className="text-xs text-content-muted">
        A checklist covering every applicable control is created automatically when you start.
      </p>

      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Plus className="size-4" aria-hidden />
        )}
        Start assessment
      </Button>
    </form>
  );
};
