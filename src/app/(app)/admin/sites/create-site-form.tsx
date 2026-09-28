"use client";

import { Loader2, MapPin, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { postJson, type ApiFailure } from "@/shared/api/client";

const EMPTY_FORM = {
  name: "",
  code: "",
  region: "",
};

export const CreateSiteForm = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorFor = (field: string) =>
    failure?.issues.find((issue) => issue.field === field)?.message;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setIsSubmitting(true);

    const outcome = await postJson("/api/organization/sites", {
      name: form.name,
      code: form.code,
      region: form.region.trim() || null,
    });

    setIsSubmitting(false);

    if (!outcome.ok) {
      setFailure(outcome);
      return;
    }

    setForm(EMPTY_FORM);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="size-4" aria-hidden />
        Add site
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add a site"
        description="Codes must be unique within the organisation."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-site" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <MapPin className="size-4" aria-hidden />
              )}
              Add site
            </Button>
          </>
        }
      >
        <form id="create-site" onSubmit={handleSubmit} className="space-y-4" noValidate>
          {failure ? (
            <Alert>{failure.message}</Alert>
          ) : null}

          <Field
            label="Site name"
            htmlFor="name"
            hint="Office, data centre, branch or facility."
            error={errorFor("name")}
          >
            <Input
              id="name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Karachi Head Office"
            />
          </Field>

          <Field
            label="Code"
            htmlFor="code"
            hint="Short unique code, e.g. KHI or LHR-DC."
            error={errorFor("code")}
          >
            <Input
              id="code"
              required
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="KHI"
            />
          </Field>

          <Field label="Region" htmlFor="region" hint="Optional." error={errorFor("region")}>
            <Input
              id="region"
              value={form.region}
              onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
              placeholder="Sindh"
            />
          </Field>
        </form>
      </Modal>
    </>
  );
};
