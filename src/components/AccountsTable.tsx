"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { SortDir } from "@/lib/sort";
import { inputField, iconButton } from "@/lib/styles";
import { SortableHeader } from "./SortableHeader";
import { DeleteButton } from "./DeleteButton";
import { PencilIcon } from "./icons";
import {
  deleteAccount,
  updateAccountField,
  type EditableAccountField,
} from "@/app/accounts/actions";

type Row = {
  id: string;
  name: string;
  type: string;
  cutoffDay: number | null;
  paymentDay: number | null;
  confirmMessage: string;
};

export type AccountsTableCopy = {
  tableName: string;
  tableType: string;
  tableCutoffDay: string;
  tablePaymentDay: string;
  editLabel: string;
  deleteLabel: string;
  deletingLabel: string;
};

export function AccountsTable({
  accounts,
  copy,
  sort,
  dir,
}: {
  accounts: Row[];
  copy: AccountsTableCopy;
  sort: string;
  dir: SortDir;
}) {
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: EditableAccountField;
  } | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function commit(id: string, field: EditableAccountField, value: string) {
    setFieldError(null);
    startTransition(async () => {
      const result = await updateAccountField(id, field, value);
      if (result?.error) {
        setFieldError(result.error);
        return;
      }
      setEditingCell(null);
    });
  }

  function isEditing(id: string, field: EditableAccountField) {
    return editingCell?.id === id && editingCell.field === field;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-canvas text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">
                <SortableHeader
                  label={copy.tableName}
                  field="name"
                  activeField={sort}
                  dir={dir}
                  basePath="/accounts"
                />
              </th>
              <th className="px-4 py-3 font-medium">
                <SortableHeader
                  label={copy.tableType}
                  field="type"
                  activeField={sort}
                  dir={dir}
                  basePath="/accounts"
                />
              </th>
              <th className="px-4 py-3 font-medium">{copy.tableCutoffDay}</th>
              <th className="px-4 py-3 font-medium">{copy.tablePaymentDay}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-t border-line transition-colors hover:bg-canvas">
                <td
                  className="px-4 py-3 text-ink"
                  onDoubleClick={() => setEditingCell({ id: account.id, field: "name" })}
                >
                  {isEditing(account.id, "name") ? (
                    <input
                      type="text"
                      autoFocus
                      defaultValue={account.name}
                      disabled={isPending}
                      className={inputField}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commit(account.id, "name", e.currentTarget.value);
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      onBlur={(e) => commit(account.id, "name", e.currentTarget.value)}
                    />
                  ) : (
                    account.name
                  )}
                </td>

                <td
                  className="px-4 py-3 text-ink-muted"
                  onDoubleClick={() => setEditingCell({ id: account.id, field: "type" })}
                >
                  {isEditing(account.id, "type") ? (
                    <input
                      type="text"
                      autoFocus
                      defaultValue={account.type}
                      disabled={isPending}
                      className={inputField}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commit(account.id, "type", e.currentTarget.value);
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      onBlur={(e) => commit(account.id, "type", e.currentTarget.value)}
                    />
                  ) : (
                    account.type
                  )}
                </td>

                <td
                  className="px-4 py-3 font-mono text-ink-muted"
                  onDoubleClick={() => setEditingCell({ id: account.id, field: "cutoffDay" })}
                >
                  {isEditing(account.id, "cutoffDay") ? (
                    <input
                      type="number"
                      min={1}
                      max={31}
                      autoFocus
                      defaultValue={account.cutoffDay ?? ""}
                      disabled={isPending}
                      className={`${inputField} w-20 font-mono`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          commit(account.id, "cutoffDay", e.currentTarget.value);
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      onBlur={(e) => commit(account.id, "cutoffDay", e.currentTarget.value)}
                    />
                  ) : (
                    (account.cutoffDay ?? <span className="text-ink-faint">—</span>)
                  )}
                </td>

                <td
                  className="px-4 py-3 font-mono text-ink-muted"
                  onDoubleClick={() => setEditingCell({ id: account.id, field: "paymentDay" })}
                >
                  {isEditing(account.id, "paymentDay") ? (
                    <input
                      type="number"
                      min={1}
                      max={31}
                      autoFocus
                      defaultValue={account.paymentDay ?? ""}
                      disabled={isPending}
                      className={`${inputField} w-20 font-mono`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          commit(account.id, "paymentDay", e.currentTarget.value);
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      onBlur={(e) => commit(account.id, "paymentDay", e.currentTarget.value)}
                    />
                  ) : (
                    (account.paymentDay ?? <span className="text-ink-faint">—</span>)
                  )}
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/accounts/${account.id}/edit`}
                      aria-label={copy.editLabel}
                      title={copy.editLabel}
                      className={iconButton}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <DeleteButton
                      action={deleteAccount.bind(null, account.id)}
                      confirmMessage={account.confirmMessage}
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

      {fieldError && <p className="mt-2 text-sm text-danger">{fieldError}</p>}
    </>
  );
}
