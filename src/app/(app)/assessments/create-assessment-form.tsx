"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
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
  const [isOpen, setIsOpen] = useState(false);
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

    setIsOpen(false);
    router.push(`/assessments/${outcome.data.id}`);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="size-4" aria-hidden />
        Start assessment
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Start an assessment"
        description="A checklist covering every applicable control is created automatically when you start."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-assessment" disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              Start assessment
            </Button>
          </>
        }
      >
        <form id="create-assessment" onSubmit={handleSubmit} className="space-y-4" noValidate>
          {failure ? (
            <Alert>{failure.message}</Alert>
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

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </form>
      </Modal>
    </>
  );
};
