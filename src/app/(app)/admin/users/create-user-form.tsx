"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { postJson, type ApiFailure } from "@/shared/api/client";

import type { RoleOption, SiteOption } from "./types";

const emptyForm = (defaultRoleId: string) => ({
  fullName: "",
  email: "",
  jobTitle: "",
  password: "",
  roleId: defaultRoleId,
  siteId: "",
});

export const CreateUserForm = ({
  sites,
  roles,
}: {
  sites: SiteOption[];
  roles: RoleOption[];
}) => {
  const router = useRouter();
  const defaultRoleId =
    roles.find((role) => role.code === "CONTROL_OWNER")?.id ?? roles[0]?.id ?? "";
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(() => emptyForm(defaultRoleId));
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorFor = (field: string) =>
    failure?.issues.find((issue) => issue.field === field)?.message;

  const update = (field: keyof ReturnType<typeof emptyForm>) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setMessage(null);
    setIsSubmitting(true);

    const outcome = await postJson("/api/users", {
      ...form,
      jobTitle: form.jobTitle.trim() || null,
      siteId: form.siteId || null,
    });

    setIsSubmitting(false);

    if (!outcome.ok) {
      setFailure(outcome);
      return;
    }

    setForm(emptyForm(defaultRoleId));
    setMessage(`Account created for ${form.email}.`);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} disabled={roles.length === 0}>
        <UserPlus className="size-4" aria-hidden />
        Add account
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add an account"
        description="The user signs in with this password."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-user" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <UserPlus className="size-4" aria-hidden />
              )}
              Create account
            </Button>
          </>
        }
      >
        <form id="create-user" onSubmit={handleSubmit} className="space-y-4" noValidate>
          {message ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p> : null}
          {failure ? <Alert>{failure.message}</Alert> : null}

          <Field label="Full name" htmlFor="fullName" error={errorFor("fullName")}>
            <Input
              id="fullName"
              required
              value={form.fullName}
              onChange={(event) => update("fullName")(event.target.value)}
            />
          </Field>

          <Field label="Email" htmlFor="email" error={errorFor("email")}>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(event) => update("email")(event.target.value)}
            />
          </Field>

          <Field label="Job title" htmlFor="jobTitle" error={errorFor("jobTitle")}>
            <Input
              id="jobTitle"
              value={form.jobTitle}
              onChange={(event) => update("jobTitle")(event.target.value)}
            />
          </Field>

          <Field label="Password" htmlFor="password" error={errorFor("password")}>
            <Input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(event) => update("password")(event.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role" htmlFor="roleId" error={errorFor("roleId")}>
              <Select
                id="roleId"
                value={form.roleId}
                onChange={(event) => update("roleId")(event.target.value)}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Site" htmlFor="siteId" hint="Leave empty for organisation-wide access">
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
          </div>
        </form>
      </Modal>
    </>
  );
};
