"use client";

import Link from "next/link";
import { useId, useRef, useState, useTransition } from "react";
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
  caption: string;
  actionsLabel: string;
  tableName: string;
  tableType: string;
  tableCutoffDay: string;
  tablePaymentDay: string;
  editLabel: string;
  deleteLabel: string;
  deletingLabel: string;
  cancelLabel: string;
};

export function AccountsTable({
  canEdit,
  accounts,
  copy,
  sort,
  dir,
}: {
  canEdit: boolean;
  accounts: Row[];
  copy: AccountsTableCopy;
  sort: string;
  dir: SortDir;
}) {
  const captionId = useId();
  const cancelled = useRef(false);
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

  function startEditing(id: string, field: EditableAccountField) {
    if (!canEdit) return;
    cancelled.current = false;
    setEditingCell({ id, field });
  }

  function cancelEditing() {
    cancelled.current = true;
    setEditingCell(null);
  }

  function isEditing(id: string, field: EditableAccountField) {
    return canEdit && editingCell?.id === id && editingCell.field === field;
  }

  return (
    <>
      <div role="region" tabIndex={0} aria-labelledby={captionId} className="relative max-w-full overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[480px] text-left text-sm">
          <caption id={captionId} className="sr-only">{copy.caption}</caption>
          <thead className="border-b border-line bg-surface text-xs font-medium text-ink-muted">
            <tr className="[&>th]:whitespace-nowrap">
              <SortableHeader
                label={copy.tableName}
                field="name"
                activeField={sort}
                dir={dir}
                basePath="/accounts"
              />
              <SortableHeader
                label={copy.tableType}
                field="type"
                activeField={sort}
                dir={dir}
                basePath="/accounts"
              />
              <th scope="col" className="px-4 py-3 font-medium">{copy.tableCutoffDay}</th>
              <th scope="col" className="px-4 py-3 font-medium">{copy.tablePaymentDay}</th>
              <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">{copy.actionsLabel}</span></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-b border-line last:border-b-0 transition-colors hover:bg-canvas/60">
                <td
                  id={`${captionId}-${account.id}`}
                  className="whitespace-nowrap px-4 py-3.5 font-semibold text-ink"
                  onDoubleClick={() => startEditing(account.id, "name")}
                >
                  {isEditing(account.id, "name") ? (
                    <input
                      type="text"
                      autoFocus
                      aria-label={copy.tableName}
                      defaultValue={account.name}
                      disabled={isPending}
                      className={inputField}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) commit(account.id, "name", e.currentTarget.value);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      onBlur={(e) => {
                        if (!cancelled.current) commit(account.id, "name", e.currentTarget.value);
                      }}
                    />
                  ) : (
                    account.name
                  )}
                </td>

                <td
                  className="whitespace-nowrap px-4 py-3.5 text-ink-muted"
                  onDoubleClick={() => startEditing(account.id, "type")}
                >
                  {isEditing(account.id, "type") ? (
                    <input
                      type="text"
                      autoFocus
                      aria-label={copy.tableType}
                      defaultValue={account.type}
                      disabled={isPending}
                      className={inputField}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) commit(account.id, "type", e.currentTarget.value);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      onBlur={(e) => {
                        if (!cancelled.current) commit(account.id, "type", e.currentTarget.value);
                      }}
                    />
                  ) : (
                    account.type
                  )}
                </td>

                <td
                  className="whitespace-nowrap px-4 py-3.5 tabular-nums text-ink-muted"
                  onDoubleClick={() => startEditing(account.id, "cutoffDay")}
                >
                  {isEditing(account.id, "cutoffDay") ? (
                    <input
                      type="number"
                      min={1}
                      max={31}
                      autoFocus
                      aria-label={copy.tableCutoffDay}
                      defaultValue={account.cutoffDay ?? ""}
                      disabled={isPending}
                      className={`${inputField} w-20 tabular-nums`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229)
                          commit(account.id, "cutoffDay", e.currentTarget.value);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      onBlur={(e) => {
                        if (!cancelled.current) commit(account.id, "cutoffDay", e.currentTarget.value);
                      }}
                    />
                  ) : (
                    (account.cutoffDay ?? <span className="text-ink-faint">—</span>)
                  )}
                </td>

                <td
                  className="whitespace-nowrap px-4 py-3.5 tabular-nums text-ink-muted"
                  onDoubleClick={() => startEditing(account.id, "paymentDay")}
                >
                  {isEditing(account.id, "paymentDay") ? (
                    <input
                      type="number"
                      min={1}
                      max={31}
                      autoFocus
                      aria-label={copy.tablePaymentDay}
                      defaultValue={account.paymentDay ?? ""}
                      disabled={isPending}
                      className={`${inputField} w-20 tabular-nums`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229)
                          commit(account.id, "paymentDay", e.currentTarget.value);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      onBlur={(e) => {
                        if (!cancelled.current) commit(account.id, "paymentDay", e.currentTarget.value);
                      }}
                    />
                  ) : (
                    (account.paymentDay ?? <span className="text-ink-faint">—</span>)
                  )}
                </td>

                <td className="px-4 py-3.5 text-right">
                  {canEdit && <div className="flex justify-end gap-1">
                    <Link
                      href={`/accounts/${account.id}/edit`}
                      aria-label={copy.editLabel}
                      aria-describedby={`${captionId}-${account.id}`}
                      title={copy.editLabel}
                      className={iconButton}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <DeleteButton
                      describedBy={`${captionId}-${account.id}`}
                      action={deleteAccount.bind(null, account.id)}
                      confirmMessage={account.confirmMessage}
                      label={copy.deleteLabel}
                      pendingLabel={copy.deletingLabel}
                      cancelLabel={copy.cancelLabel}
                    />
                  </div>}
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
