"use client";

import { useState, useTransition } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { SortDir } from "@/lib/sort";
import { formatCents, centsToPesosInput } from "@/lib/currency";
import { formatDate, dateToInputValue } from "@/lib/date";
import { EXPENSE_TYPES, isExpenseType } from "@/lib/expense-type";
import { inputField, iconButton } from "@/lib/styles";
import { SortableHeader } from "./SortableHeader";
import { DeleteButton } from "./DeleteButton";
import { EditExpenseModal } from "./EditExpenseModal";
import { NoteIcon, PencilIcon } from "./icons";
import {
  deleteExpense,
  updateExpenseField,
  type EditableExpenseField,
} from "@/app/expenses/actions";

type Option = { id: string; label: string };

type Row = {
  id: string;
  date: Date;
  description: string;
  notes: string | null;
  amountCents: number;
  type: string | null;
  excludeFromTotals: boolean;
  accountId: string;
  categoryId: string | null;
  account: { name: string };
  category: { name: string } | null;
  confirmMessage: string;
};

export type ExpensesTableCopy = {
  tableDate: string;
  tableDescription: string;
  tableAccount: string;
  tableCategory: string;
  tableType: string;
  tableAmount: string;
  noCategory: string;
  noType: string;
  msiBadge: string;
  editLabel: string;
  deleteLabel: string;
  deletingLabel: string;
  editTitle: string;
  editSubmit: string;
  savingLabel: string;
  form: Dictionary["expenses"]["form"];
  expenseTypes: Dictionary["expenseTypes"];
};

export function ExpensesTable({
  expenses,
  accounts,
  categories,
  locale,
  copy,
  sort,
  dir,
  query,
}: {
  expenses: Row[];
  accounts: Option[];
  categories: Option[];
  locale: Locale;
  copy: ExpensesTableCopy;
  sort: string;
  dir: SortDir;
  query: { q: string; from: string; to: string };
}) {
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: EditableExpenseField;
  } | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [hoverNote, setHoverNote] = useState<{ text: string; x: number; y: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  function commit(id: string, field: EditableExpenseField, value: string) {
    setFieldError(null);
    startTransition(async () => {
      const result = await updateExpenseField(id, field, value);
      if (result?.error) {
        setFieldError(result.error);
        return;
      }
      setEditingCell(null);
    });
  }

  function isEditing(id: string, field: EditableExpenseField) {
    return editingCell?.id === id && editingCell.field === field;
  }

  const header = (label: string, key: string, align?: "right") => (
    <SortableHeader
      label={label}
      field={key}
      activeField={sort}
      dir={dir}
      basePath="/expenses"
      query={query}
      align={align}
    />
  );

  const editingExpense = expenses.find((expense) => expense.id === editingExpenseId) ?? null;

  return (
    <>
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-canvas text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{header(copy.tableDate, "date")}</th>
              <th className="px-4 py-3 font-medium">{header(copy.tableDescription, "description")}</th>
              <th className="px-4 py-3 font-medium">{header(copy.tableAccount, "account")}</th>
              <th className="px-4 py-3 font-medium">{header(copy.tableCategory, "category")}</th>
              <th className="px-4 py-3 font-medium">{header(copy.tableType, "type")}</th>
              <th className="px-4 py-3 text-right font-medium">
                {header(copy.tableAmount, "amount", "right")}
              </th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className={`border-t border-line transition-colors hover:bg-canvas ${
                  expense.excludeFromTotals ? "opacity-50" : ""
                }`}
                onMouseMove={(e) => {
                  if (expense.notes) {
                    setHoverNote({ text: expense.notes, x: e.clientX, y: e.clientY });
                  }
                }}
                onMouseLeave={() => setHoverNote(null)}
              >
                <td
                  className="whitespace-nowrap px-4 py-3 font-mono text-ink-muted"
                  onDoubleClick={() => setEditingCell({ id: expense.id, field: "date" })}
                >
                  {isEditing(expense.id, "date") ? (
                    <input
                      type="date"
                      autoFocus
                      defaultValue={dateToInputValue(expense.date)}
                      disabled={isPending}
                      className={`${inputField} w-36`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commit(expense.id, "date", e.currentTarget.value);
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      onBlur={(e) => commit(expense.id, "date", e.currentTarget.value)}
                    />
                  ) : (
                    formatDate(expense.date, locale)
                  )}
                </td>

                <td
                  className="px-4 py-3 text-ink"
                  onDoubleClick={() => setEditingCell({ id: expense.id, field: "description" })}
                >
                  {isEditing(expense.id, "description") ? (
                    <input
                      type="text"
                      autoFocus
                      defaultValue={expense.description}
                      disabled={isPending}
                      className={inputField}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          commit(expense.id, "description", e.currentTarget.value);
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      onBlur={(e) => commit(expense.id, "description", e.currentTarget.value)}
                    />
                  ) : (
                    <>
                      {expense.description}
                      {expense.excludeFromTotals && (
                        <span className="ml-2 rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                          {copy.msiBadge}
                        </span>
                      )}
                      {expense.notes && (
                        <NoteIcon className="ml-1.5 inline-block h-3.5 w-3.5 align-text-bottom text-ink-faint" />
                      )}
                    </>
                  )}
                </td>

                <td
                  className="px-4 py-3 text-ink-muted"
                  onDoubleClick={() => setEditingCell({ id: expense.id, field: "accountId" })}
                >
                  {isEditing(expense.id, "accountId") ? (
                    <select
                      autoFocus
                      defaultValue={expense.accountId}
                      disabled={isPending}
                      className={inputField}
                      onChange={(e) => commit(expense.id, "accountId", e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      onBlur={() => setEditingCell(null)}
                    >
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    expense.account.name
                  )}
                </td>

                <td
                  className="px-4 py-3 text-ink-muted"
                  onDoubleClick={() => setEditingCell({ id: expense.id, field: "categoryId" })}
                >
                  {isEditing(expense.id, "categoryId") ? (
                    <select
                      autoFocus
                      defaultValue={expense.categoryId ?? ""}
                      disabled={isPending}
                      className={inputField}
                      onChange={(e) => commit(expense.id, "categoryId", e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      onBlur={() => setEditingCell(null)}
                    >
                      <option value="">{copy.noCategory}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    expense.category?.name ?? (
                      <span className="text-ink-faint">{copy.noCategory}</span>
                    )
                  )}
                </td>

                <td
                  className="px-4 py-3 text-ink-muted"
                  onDoubleClick={() => setEditingCell({ id: expense.id, field: "type" })}
                >
                  {isEditing(expense.id, "type") ? (
                    <select
                      autoFocus
                      defaultValue={expense.type ?? ""}
                      disabled={isPending}
                      className={inputField}
                      onChange={(e) => commit(expense.id, "type", e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      onBlur={() => setEditingCell(null)}
                    >
                      {EXPENSE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {copy.expenseTypes[type]}
                        </option>
                      ))}
                    </select>
                  ) : isExpenseType(expense.type) ? (
                    copy.expenseTypes[expense.type]
                  ) : (
                    <span className="text-ink-faint">{copy.noType}</span>
                  )}
                </td>

                <td
                  className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold tabular-nums text-ink"
                  onDoubleClick={() => setEditingCell({ id: expense.id, field: "amount" })}
                >
                  {isEditing(expense.id, "amount") ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      autoFocus
                      defaultValue={centsToPesosInput(expense.amountCents)}
                      disabled={isPending}
                      className={`${inputField} w-28 text-right font-mono`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commit(expense.id, "amount", e.currentTarget.value);
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      onBlur={(e) => commit(expense.id, "amount", e.currentTarget.value)}
                    />
                  ) : (
                    formatCents(expense.amountCents, locale)
                  )}
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={copy.editLabel}
                      title={copy.editLabel}
                      className={iconButton}
                      onClick={() => setEditingExpenseId(expense.id)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <DeleteButton
                      action={deleteExpense.bind(null, expense.id)}
                      confirmMessage={expense.confirmMessage}
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

      {hoverNote && (
        <div
          className="pointer-events-none fixed z-50 w-64 rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed whitespace-pre-wrap text-ink shadow-card"
          style={{
            left: Math.min(hoverNote.x + 14, window.innerWidth - 272),
            top: Math.min(hoverNote.y + 14, window.innerHeight - 16),
          }}
        >
          {hoverNote.text}
        </div>
      )}

      {editingExpense && (
        <EditExpenseModal
          key={editingExpense.id}
          expense={editingExpense}
          accounts={accounts}
          categories={categories}
          onClose={() => setEditingExpenseId(null)}
          copy={copy}
        />
      )}
    </>
  );
}
