"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ROLE_LABELS, USER_ROLES } from "@/modules/auth/domain/user";
import type { ApiResponse } from "@/shared/api/http";
import type { FieldIssue } from "@/shared/core/errors";

import type { SiteOption } from "./types";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  jobTitle: "",
  password: "",
  role: "VIEWER" as (typeof USER_ROLES)[number],
  siteId: "",
};

export const CreateUserForm = ({ sites }: { sites: SiteOption[] }) => {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [issues, setIssues] = useState<readonly FieldIssue[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorFor = (field: string) => issues.find((issue) => issue.field === field)?.message;

  const update = (field: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIssues([]);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          jobTitle: form.jobTitle.trim() || null,
          siteId: form.siteId || null,
        }),
      });

      const payload: ApiResponse<unknown> = await response.json();

      if (!response.ok && "error" in payload) {
        setIssues(payload.error.issues ?? []);
        setMessage(payload.error.message);
        return;
      }

      setForm(EMPTY_FORM);
      setMessage(`Account created for ${form.email}.`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {message ? <p className="text-sm text-content-muted">{message}</p> : null}

      <Field label="Full name" htmlFor="fullName" error={errorFor("fullName")}>
        <Input
          id="fullName"
          required
          value={form.fullName}
          onChange={(event) => update("fullName")(event.target.value)}
        />
      </Field>

      <Field label="Email address" htmlFor="newEmail" error={errorFor("email")}>
        <Input
          id="newEmail"
          type="email"
          required
          value={form.email}
          onChange={(event) => update("email")(event.target.value)}
        />
      </Field>

      <Field label="Job title" htmlFor="jobTitle" hint="Optional" error={errorFor("jobTitle")}>
        <Input
          id="jobTitle"
          value={form.jobTitle}
          onChange={(event) => update("jobTitle")(event.target.value)}
        />
      </Field>

      <Field
        label="Temporary password"
        htmlFor="newPassword"
        hint="At least 10 characters, including a letter and a number."
        error={errorFor("password")}
      >
        <Input
          id="newPassword"
          type="text"
          required
          value={form.password}
          onChange={(event) => update("password")(event.target.value)}
        />
      </Field>

      <Field label="Role" htmlFor="role" error={errorFor("role")}>
        <Select
          id="role"
          value={form.role}
          onChange={(event) => update("role")(event.target.value)}
        >
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Site" htmlFor="siteId" hint="Leave empty for district-wide access">
        <Select
          id="siteId"
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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <UserPlus className="size-4" aria-hidden />
        )}
        Create account
      </Button>
    </form>
  );
};
