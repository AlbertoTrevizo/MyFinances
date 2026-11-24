"use client";

import { useActionState, useEffect, useState } from "react";
import type { SortDir } from "@/lib/sort";
import { buttonPrimary, iconButton, inputField } from "@/lib/styles";
import { SortableHeader } from "./SortableHeader";
import { DeleteButton } from "./DeleteButton";
import { FormField } from "./FormField";
import { Modal } from "./Modal";
import { PencilIcon } from "./icons";
import { deleteUser, updateUser, setUserRole } from "@/app/users/actions";
import type { Dictionary } from "@/i18n/dictionaries";
import type { SignInMethod, AccountStatus } from "@/lib/user-status";
import { ROLES, type Role } from "@/lib/roles";

export type UserRow = {
  id: string;
  name: string | null;
  lastName: string | null;
  email: string;
  method: SignInMethod;
  status: AccountStatus;
  role: Role;
  createdLabel: string;
  confirmMessage: string;
};

type Copy = {
  users: Omit<Dictionary["users"], "confirmDelete">;
  validation: Dictionary["validation"];
  register: Dictionary["register"];
  emailLabel: string;
  editLabel: string;
  deleteLabel: string;
  deletingLabel: string;
  savingLabel: string;
};

const dash = <span className="text-ink-faint">—</span>;

function EditUserModal({ row, copy, onClose }: { row: UserRow; copy: Copy; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(updateUser.bind(null, row.id), undefined);
  const done = state?.ok === true && !state.pendingEmailChange;
  useEffect(() => {
    if (done) onClose();
  }, [done, onClose]);

  const errors = state?.fieldErrors;
  const v = state?.values ?? { name: row.name ?? "", lastName: row.lastName ?? "", email: row.email };
  return (
    <Modal onClose={onClose} title={<h2 className="mb-4 text-lg font-semibold text-ink">{copy.users.editTitle}</h2>}>
      {state?.ok && state.pendingEmailChange ? (
        <div className="flex flex-col gap-4">
          <p role="status" className="text-sm text-ink-muted">{copy.users.emailChangePending}</p>
          <button type="button" onClick={onClose} className={buttonPrimary}>{copy.users.close}</button>
        </div>
      ) : (
        <form action={formAction} noValidate className="flex flex-col gap-4">
          <FormField label={copy.register.nameLabel} name="name" defaultValue={v.name} error={errors?.name} />
          <FormField label={copy.register.lastNameLabel} name="lastName" defaultValue={v.lastName} error={errors?.lastName} />
          <FormField label={copy.emailLabel} name="email" type="email" defaultValue={v.email} error={errors?.email} />
          {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-ink-muted hover:text-ink">
              {copy.users.cancel}
            </button>
            <button type="submit" disabled={isPending} className={buttonPrimary}>
              {isPending ? copy.savingLabel : copy.users.save}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ChangeRoleModal({ row, copy, onClose }: { row: UserRow; copy: Copy; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(setUserRole.bind(null, row.id), undefined);
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state?.ok, onClose]);

  return (
    <Modal onClose={onClose} title={<h2 className="mb-4 text-lg font-semibold text-ink">{copy.users.changeRoleTitle}</h2>}>
      <form action={formAction} className="flex flex-col gap-4">
        <p className="break-all text-sm text-ink-muted">{row.email}</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-role" className="text-sm font-medium text-ink-muted">{copy.users.roleLabel}</label>
          <select
            id="user-role"
            name="role"
            defaultValue={row.role}
            className={inputField}
            aria-invalid={state?.error ? true : undefined}
            aria-describedby={state?.error ? "user-role-error" : undefined}
          >
            {ROLES.map((role) => <option key={role} value={role}>{copy.users.roles[role]}</option>)}
          </select>
        </div>
        {state?.error && <p id="user-role-error" role="alert" className="text-sm text-danger">{state.error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-ink-muted hover:text-ink">
            {copy.users.cancel}
          </button>
          <button type="submit" disabled={isPending} className={buttonPrimary}>
            {isPending ? copy.savingLabel : copy.users.changeRole}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function UsersTable({
  rows,
  copy,
  sort,
  dir,
  q,
}: {
  rows: UserRow[];
  copy: Copy;
  sort: string;
  dir: SortDir;
  q: string;
}) {
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [changingRole, setChangingRole] = useState<UserRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const header = (label: string, field: string) => (
    <SortableHeader label={label} field={field} activeField={sort} dir={dir} basePath="/users" query={{ q: q || undefined }} />
  );

  return (
    <>
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-canvas text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{header(copy.users.tableName, "name")}</th>
              <th className="px-4 py-3 font-medium">{header(copy.users.tableLastName, "lastName")}</th>
              <th className="px-4 py-3 font-medium">{header(copy.users.tableEmail, "email")}</th>
              <th className="px-4 py-3 font-medium">{header(copy.users.tableMethod, "method")}</th>
              <th className="px-4 py-3 font-medium">{header(copy.users.tableStatus, "status")}</th>
              <th className="px-4 py-3 font-medium">{header(copy.users.tableRole, "role")}</th>
              <th className="px-4 py-3 font-medium">{header(copy.users.tableCreatedAt, "createdAt")}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line transition-colors hover:bg-canvas">
                <td className="px-4 py-3 text-ink">{row.name || dash}</td>
                <td className="px-4 py-3 text-ink">{row.lastName || dash}</td>
                <td className="px-4 py-3 text-ink-muted">{row.email}</td>
                <td className="px-4 py-3 text-ink-muted">{copy.users.method[row.method]}</td>
                <td className="px-4 py-3 text-ink-muted">{copy.users.status[row.status]}</td>
                <td className="px-4 py-3 text-ink-muted">{copy.users.roles[row.role]}</td>
                <td className="px-4 py-3 text-ink-muted">{row.createdLabel || dash}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setChangingRole(row)}
                      className="whitespace-nowrap rounded-lg px-2 py-1 text-sm text-primary hover:bg-canvas"
                    >
                      {copy.users.changeRole}
                    </button>
                    <button
                      type="button"
                      aria-label={copy.editLabel}
                      title={copy.editLabel}
                      className={iconButton}
                      onClick={() => setEditing(row)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <DeleteButton
                      action={async () => {
                        setDeleteError(null);
                        const result = await deleteUser(row.id);
                        if (result?.error) setDeleteError(result.error);
                      }}
                      confirmMessage={row.confirmMessage}
                      label={copy.deleteLabel}
                      pendingLabel={copy.deletingLabel}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteError && <p role="alert" className="mt-2 text-sm text-danger">{deleteError}</p>}
      {editing && <EditUserModal row={editing} copy={copy} onClose={() => setEditing(null)} />}
      {changingRole && <ChangeRoleModal row={changingRole} copy={copy} onClose={() => setChangingRole(null)} />}
    </>
  );
}
