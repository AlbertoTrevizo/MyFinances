"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
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
  actionsLabel: string;
  users: Omit<Dictionary["users"], "confirmDelete">;
  validation: Dictionary["validation"];
  register: Dictionary["register"];
  emailLabel: string;
  editLabel: string;
  deleteLabel: string;
  deletingLabel: string;
  cancelLabel: string;
  savingLabel: string;
};

const dash = <span className="text-ink-faint">—</span>;

function EditUserModal({ row, copy, onClose }: { row: UserRow; copy: Copy; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(updateUser.bind(null, row.id), undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLParagraphElement>(null);
  const done = state?.ok === true && !state.pendingEmailChange;
  useEffect(() => {
    if (done) onClose();
  }, [done, onClose]);

  useEffect(() => {
    resultRef.current?.focus();
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  const errors = state?.fieldErrors;
  const v = state?.values ?? { name: row.name ?? "", lastName: row.lastName ?? "", email: row.email };
  return (
    <>
      {state?.ok && state.pendingEmailChange ? (
        <div className="flex flex-col gap-4">
          <p ref={resultRef} tabIndex={-1} className="text-sm text-ink-muted">{copy.users.emailChangePending}</p>
          <button type="button" onClick={onClose} className={buttonPrimary}>{copy.users.close}</button>
        </div>
      ) : (
        <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-4">
          <FormField label={copy.register.nameLabel} name="name" defaultValue={v.name} error={errors?.name} />
          <FormField label={copy.register.lastNameLabel} name="lastName" defaultValue={v.lastName} error={errors?.lastName} />
          <FormField label={copy.emailLabel} name="email" type="email" defaultValue={v.email} error={errors?.email} />
          <div aria-live="polite">
            {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          </div>
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
    </>
  );
}

function ChangeRoleModal({ row, copy, onClose }: { row: UserRow; copy: Copy; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(setUserRole.bind(null, row.id), undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state?.ok, onClose]);

  return (
    <>
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <p className="break-all text-sm text-ink-muted">{row.email}</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-role" className="text-sm font-medium text-ink-muted">{copy.users.roleLabel}</label>
          <select
            key={state?.values?.role ?? row.role}
            id="user-role"
            name="role"
            defaultValue={state?.values?.role ?? row.role}
            className={inputField}
            aria-invalid={state?.error ? true : undefined}
            aria-describedby={state?.error ? "user-role-error" : undefined}
          >
            {ROLES.map((role) => <option key={role} value={role}>{copy.users.roles[role]}</option>)}
          </select>
        </div>
        <div aria-live="polite">
          {state?.error && <p id="user-role-error" className="text-sm text-danger">{state.error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-ink-muted hover:text-ink">
            {copy.users.cancel}
          </button>
          <button type="submit" disabled={isPending} className={buttonPrimary}>
            {isPending ? copy.savingLabel : copy.users.changeRole}
          </button>
        </div>
      </form>
    </>
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
  const captionId = useId();
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [changingRole, setChangingRole] = useState<UserRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const header = (label: string, field: string) => (
    <SortableHeader label={label} field={field} activeField={sort} dir={dir} basePath="/users" query={{ q: q || undefined }} />
  );

  return (
    <>
      <div role="region" tabIndex={0} aria-labelledby={captionId} className="relative max-w-full overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption id={captionId} className="sr-only">{copy.users.title}</caption>
          <thead className="border-b border-line bg-surface text-xs font-medium text-ink-muted">
            <tr className="[&>th:nth-child(n+4)]:whitespace-nowrap">
              {header(copy.users.tableName, "name")}
              {header(copy.users.tableLastName, "lastName")}
              {header(copy.users.tableEmail, "email")}
              {header(copy.users.tableMethod, "method")}
              {header(copy.users.tableStatus, "status")}
              {header(copy.users.tableRole, "role")}
              {header(copy.users.tableCreatedAt, "createdAt")}
              <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">{copy.actionsLabel}</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-b-0 transition-colors hover:bg-canvas/60">
                <td className="px-4 py-3.5 font-semibold text-ink">{row.name || dash}</td>
                <td className="px-4 py-3.5 text-ink-muted">{row.lastName || dash}</td>
                <td id={`${captionId}-${row.id}`} className="px-4 py-3.5 text-ink-muted">{row.email}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-ink-muted">{copy.users.method[row.method]}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-ink-muted">{copy.users.status[row.status]}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-ink-muted">{copy.users.roles[row.role]}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-ink-muted">{row.createdLabel || dash}</td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-describedby={`${captionId}-${row.id}`}
                      onClick={() => setChangingRole(row)}
                      className="whitespace-nowrap rounded-lg px-2 py-1 text-sm text-primary hover:bg-canvas"
                    >
                      {copy.users.changeRole}
                    </button>
                    <button
                      type="button"
                      aria-label={copy.editLabel}
                      aria-describedby={`${captionId}-${row.id}`}
                      title={copy.editLabel}
                      className={iconButton}
                      onClick={() => setEditing(row)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <DeleteButton
                      describedBy={`${captionId}-${row.id}`}
                      action={async () => {
                        setDeleteError(null);
                        const result = await deleteUser(row.id);
                        if (result?.error) setDeleteError(result.error);
                      }}
                      confirmMessage={row.confirmMessage}
                      label={copy.deleteLabel}
                      pendingLabel={copy.deletingLabel}
                      cancelLabel={copy.cancelLabel}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteError && <p role="alert" className="mt-2 text-sm text-danger">{deleteError}</p>}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={copy.users.editTitle}>
        {editing && <EditUserModal row={editing} copy={copy} onClose={() => setEditing(null)} />}
      </Modal>
      <Modal open={changingRole !== null} onClose={() => setChangingRole(null)} title={copy.users.changeRoleTitle}>
        {changingRole && <ChangeRoleModal row={changingRole} copy={copy} onClose={() => setChangingRole(null)} />}
      </Modal>
    </>
  );
}
