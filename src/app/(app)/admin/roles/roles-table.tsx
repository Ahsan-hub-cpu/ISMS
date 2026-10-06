"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  type Permission,
} from "@/modules/auth/domain/permissions";
import { deleteJson, patchJson, type ApiFailure } from "@/shared/api/client";

import type { RoleRow } from "./types";

interface RolesTableProps {
  roles: RoleRow[];
}

export const RolesTable = ({ roles }: RolesTableProps) => {
  const router = useRouter();
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (role: RoleRow) => {
    if (role.isSystem) return;
    if (
      !window.confirm(
        role.userCount > 0
          ? `“${role.name}” still has ${role.userCount} user(s). Reassign them first.`
          : `Delete role “${role.name}”?`,
      )
    ) {
      return;
    }

    if (role.userCount > 0) return;

    setPendingId(role.id);
    setError(null);
    const outcome = await deleteJson(`/api/roles/${role.id}`);
    setPendingId(null);

    if (!outcome.ok) {
      setError(outcome.message);
      return;
    }

    router.refresh();
  };

  return (
    <div>
      {error ? (
        <p
          role="alert"
          className="mx-5 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
        >
          {error}
        </p>
      ) : null}

      <Table className="min-w-[640px]">
        <THead>
          <TR>
            <TH>Role</TH>
            <TH>Permissions</TH>
            <TH>Users</TH>
            <TH className="w-40">Actions</TH>
          </TR>
        </THead>
        <tbody>
          {roles.map((role) => {
            const isPending = pendingId === role.id;
            return (
              <TR key={role.id}>
                <TD>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-content">{role.name}</span>
                    {role.isSystem ? (
                      <Badge tone="neutral">System</Badge>
                    ) : (
                      <Badge tone="brand">Custom</Badge>
                    )}
                  </div>
                  {role.description ? (
                    <p className="mt-1 max-w-md text-xs leading-relaxed text-content-muted">
                      {role.description}
                    </p>
                  ) : null}
                  <p className="mt-1 font-mono text-[0.625rem] text-content-subtle">{role.code}</p>
                </TD>
                <TD className="text-sm text-content-muted">{role.permissions.length}</TD>
                <TD className="text-sm text-content-muted">{role.userCount}</TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setEditing(role)}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Edit
                    </Button>
                    {!role.isSystem ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleDelete(role)}
                        className="text-rose-700 hover:text-rose-800 dark:text-rose-300"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </TD>
              </TR>
            );
          })}
        </tbody>
      </Table>

      {editing ? (
        <EditRoleModal
          role={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
};

const EditRoleModal = ({
  role,
  onClose,
  onSaved,
}: {
  role: RoleRow;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? "");
  const [permissions, setPermissions] = useState<Permission[]>([...role.permissions]);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(role.name);
    setDescription(role.description ?? "");
    setPermissions([...role.permissions]);
    setFailure(null);
  }, [role]);

  const errorFor = (field: string) =>
    failure?.issues.find((issue) => issue.field === field)?.message;

  const togglePermission = (permission: Permission) => {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setIsSubmitting(true);

    const outcome = await patchJson(`/api/roles/${role.id}`, {
      name,
      description: description.trim() || null,
      permissions,
    });

    setIsSubmitting(false);

    if (!outcome.ok) {
      setFailure(outcome);
      return;
    }

    onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${role.name}`}
      description={
        role.isSystem
          ? "System role — you can change the name, description and permissions, but not delete it."
          : "Update the name, description and permissions for this role."
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-role" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-role" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {failure ? <Alert>{failure.message}</Alert> : null}

        <Field label="Name" htmlFor="edit-role-name" error={errorFor("name")}>
          <Input
            id="edit-role-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>

        <Field label="Description" htmlFor="edit-role-description" error={errorFor("description")}>
          <Textarea
            id="edit-role-description"
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <fieldset className="space-y-4">
          <legend className="text-[0.8125rem] font-semibold text-content">Permissions</legend>
          {errorFor("permissions") ? (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {errorFor("permissions")}
            </p>
          ) : null}

          {PERMISSION_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-content-subtle">
                {group.title}
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {group.permissions.map((permission) => (
                  <label
                    key={permission}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-transparent px-2 py-1.5 hover:border-surface-border hover:bg-surface-sunken/60"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 rounded border-surface-border-strong text-brand-600 focus:ring-brand-500"
                      checked={permissions.includes(permission)}
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
                ))}
              </div>
            </div>
          ))}
        </fieldset>
      </form>
    </Modal>
  );
};
