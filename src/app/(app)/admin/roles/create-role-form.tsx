"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  type Permission,
} from "@/modules/auth/domain/permissions";
import { postJson, type ApiFailure } from "@/shared/api/client";

const EMPTY_FORM = {
  name: "",
  description: "",
  permissions: [] as Permission[],
};

export const CreateRoleForm = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorFor = (field: string) =>
    failure?.issues.find((issue) => issue.field === field)?.message;

  const togglePermission = (permission: Permission) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setIsSubmitting(true);

    const outcome = await postJson("/api/roles", {
      name: form.name,
      description: form.description.trim() || null,
      permissions: form.permissions,
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
        Add role
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add a role"
        description="Pick a name and the permissions this profile should grant."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-role" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Create role
            </Button>
          </>
        }
      >
        <form id="create-role" onSubmit={handleSubmit} className="space-y-5" noValidate>
          {failure ? <Alert>{failure.message}</Alert> : null}

          <Field label="Name" htmlFor="role-name" error={errorFor("name")}>
            <Input
              id="role-name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Site security lead"
            />
          </Field>

          <Field label="Description" htmlFor="role-description" error={errorFor("description")}>
            <Textarea
              id="role-description"
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Optional summary shown to admins."
            />
          </Field>

          <fieldset className="space-y-4">
            <legend className="text-[0.8125rem] font-semibold text-content">Permissions</legend>
            {errorFor("permissions") ? (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {errorFor("permissions")}
              </p>
            ) : (
              <p className="text-xs text-content-muted">Select at least one.</p>
            )}

            {PERMISSION_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-content-subtle">
                  {group.title}
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {group.permissions.map((permission) => {
                    const checked = form.permissions.includes(permission);
                    return (
                      <label
                        key={permission}
                        className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-transparent px-2 py-1.5 hover:border-surface-border hover:bg-surface-sunken/60"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 rounded border-surface-border-strong text-brand-600 focus:ring-brand-500"
                          checked={checked}
                          onChange={() => togglePermission(permission)}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm text-content">
                            {PERMISSION_LABELS[permission]}
                          </span>
                          <span className="block font-mono text-[0.625rem] text-content-subtle">
                            {permission}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </fieldset>
        </form>
      </Modal>
    </>
  );
};
