"use client";

import { useId, useRef, useState, useTransition } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { SortDir } from "@/lib/sort";
import { formatCents, centsToPesosInput } from "@/lib/currency";
import { formatDate, dateToInputValue } from "@/lib/date";
import { EXPENSE_TYPES, isExpenseType } from "@/lib/expense-type";
import { isMsiInstallment } from "@/lib/msi";
import { inputField, iconButton, badge, expenseTypeBadge } from "@/lib/styles";
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
  msiGroupId: string | null;
  accountId: string;
  categoryId: string | null;
  account: { name: string };
  category: { name: string } | null;
  confirmMessage: string;
};

export type ExpensesTableCopy = {
  caption: string;
  actionsLabel: string;
  tableDate: string;
  tableDescription: string;
  tableAccount: string;
  tableCategory: string;
  tableType: string;
  tableAmount: string;
  noCategory: string;
  noType: string;
  msiBadge: string;
  msiInstallmentLocked: string;
  editLabel: string;
  deleteLabel: string;
  deletingLabel: string;
  cancelLabel: string;
  closeLabel: string;
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
  query: { q: string; month: string };
}) {
  const captionId = useId();
  const cancelled = useRef(false);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: EditableExpenseField;
  } | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
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

  function startEditing(expense: Row, field: EditableExpenseField) {
    if (!isMsiInstallment(expense)) {
      cancelled.current = false;
      setEditingCell({ id: expense.id, field });
    }
  }

  function cancelEditing() {
    cancelled.current = true;
    setEditingCell(null);
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
      <div role="region" tabIndex={0} aria-labelledby={captionId} className="relative max-w-full overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption id={captionId} className="sr-only">{copy.caption}</caption>
          <thead className="border-b border-line bg-surface text-xs font-medium text-ink-muted">
            <tr className="[&>th:not(:nth-child(2))]:whitespace-nowrap">
              {header(copy.tableDate, "date")}
              {header(copy.tableDescription, "description")}
              {header(copy.tableAccount, "account")}
              {header(copy.tableCategory, "category")}
              {header(copy.tableType, "type")}
              {header(copy.tableAmount, "amount", "right")}
              <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">{copy.actionsLabel}</span></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className={`border-b border-line last:border-b-0 transition-colors hover:bg-canvas/60 ${
                  expense.excludeFromTotals ? "bg-canvas" : ""
                }`}
              >
                <td
                  className="whitespace-nowrap px-4 py-3.5 tabular-nums text-ink-muted"
                  onDoubleClick={() => startEditing(expense, "date")}
                >
                  {isEditing(expense.id, "date") ? (
                    <input
                      type="date"
                      autoFocus
                      aria-label={copy.tableDate}
                      defaultValue={dateToInputValue(expense.date)}
                      disabled={isPending}
                      className={`${inputField} w-36`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) commit(expense.id, "date", e.currentTarget.value);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      onBlur={(e) => {
                        if (!cancelled.current) commit(expense.id, "date", e.currentTarget.value);
                      }}
                    />
                  ) : (
                    formatDate(expense.date, locale)
                  )}
                </td>

                <td
                  id={`${captionId}-${expense.id}`}
                  className={`px-4 py-3.5 ${isMsiInstallment(expense) ? "font-normal text-ink-muted" : "font-semibold text-ink"}`}
                  onDoubleClick={() => startEditing(expense, "description")}
                >
                  {isEditing(expense.id, "description") ? (
                    <input
                      type="text"
                      autoFocus
                      aria-label={copy.tableDescription}
                      defaultValue={expense.description}
                      disabled={isPending}
                      className={inputField}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229)
                          commit(expense.id, "description", e.currentTarget.value);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      onBlur={(e) => {
                        if (!cancelled.current) commit(expense.id, "description", e.currentTarget.value);
                      }}
                    />
                  ) : (
                    <>
                      {expense.description}
                      {expense.excludeFromTotals && (
                        <span className={`${badge} ml-2 bg-primary-soft text-primary-strong`}>
                          {copy.msiBadge}
                        </span>
                      )}
                      {expense.notes && (
                        <>
                          <button
                            type="button"
                            popoverTarget={`${captionId}-note-${expense.id}`}
                            aria-label={copy.form.notesLabel}
                            className={`${iconButton} ml-1.5 align-middle`}
                          >
                            <NoteIcon className="h-3.5 w-3.5 text-ink-faint" />
                          </button>
                          <div
                            id={`${captionId}-note-${expense.id}`}
                            popover="auto"
                            role="tooltip"
                            className="fixed inset-0 m-auto max-h-[80vh] w-64 max-w-[calc(100%-2rem)] overflow-y-auto rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed whitespace-pre-wrap text-ink shadow-card"
                          >
                            {expense.notes}
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {isMsiInstallment(expense) && (
                    <span className="sr-only">{copy.msiInstallmentLocked}</span>
                  )}
                </td>

                <td
                  className="whitespace-nowrap px-4 py-3.5 text-ink-muted"
                  onDoubleClick={() => startEditing(expense, "accountId")}
                >
                  {isEditing(expense.id, "accountId") ? (
                    <select
                      autoFocus
                      aria-label={copy.tableAccount}
                      defaultValue={expense.accountId}
                      disabled={isPending}
                      className={inputField}
                      onChange={(e) => commit(expense.id, "accountId", e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") cancelEditing();
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
                  className="whitespace-nowrap px-4 py-3.5 text-ink-muted"
                  onDoubleClick={() => startEditing(expense, "categoryId")}
                >
                  {isEditing(expense.id, "categoryId") ? (
                    <select
                      autoFocus
                      aria-label={copy.tableCategory}
                      defaultValue={expense.categoryId ?? ""}
                      disabled={isPending}
                      className={inputField}
                      onChange={(e) => commit(expense.id, "categoryId", e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") cancelEditing();
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
                  className="whitespace-nowrap px-4 py-3.5 text-ink-muted"
                  onDoubleClick={() => startEditing(expense, "type")}
                >
                  {isEditing(expense.id, "type") ? (
                    <select
                      autoFocus
                      aria-label={copy.tableType}
                      defaultValue={expense.type ?? ""}
                      disabled={isPending}
                      className={inputField}
                      onChange={(e) => commit(expense.id, "type", e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") cancelEditing();
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
                    <span className={`${badge} ${expenseTypeBadge[expense.type]}`}>
                      {copy.expenseTypes[expense.type]}
                    </span>
                  ) : (
                    <span className="text-ink-faint">{copy.noType}</span>
                  )}
                </td>

                <td
                  className="whitespace-nowrap px-4 py-3.5 text-right font-medium tabular-nums text-ink"
                  onDoubleClick={() => startEditing(expense, "amount")}
                >
                  {isEditing(expense.id, "amount") ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      autoFocus
                      aria-label={copy.tableAmount}
                      defaultValue={centsToPesosInput(expense.amountCents)}
                      disabled={isPending}
                      className={`${inputField} w-28 text-right tabular-nums`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) commit(expense.id, "amount", e.currentTarget.value);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      onBlur={(e) => {
                        if (!cancelled.current) commit(expense.id, "amount", e.currentTarget.value);
                      }}
                    />
                  ) : (
                    formatCents(expense.amountCents, locale)
                  )}
                </td>

                <td className="px-4 py-3.5 text-right">
                  {!isMsiInstallment(expense) && (
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        aria-label={copy.editLabel}
                        aria-describedby={`${captionId}-${expense.id}`}
                        title={copy.editLabel}
                        className={iconButton}
                        onClick={() => setEditingExpenseId(expense.id)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <DeleteButton
                        describedBy={`${captionId}-${expense.id}`}
                        action={deleteExpense.bind(null, expense.id)}
                        confirmMessage={expense.confirmMessage}
                        label={copy.deleteLabel}
                        pendingLabel={copy.deletingLabel}
                        cancelLabel={copy.cancelLabel}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fieldError && <p className="mt-2 text-sm text-danger">{fieldError}</p>}

      <EditExpenseModal
        expense={editingExpense}
        accounts={accounts}
        categories={categories}
        onClose={() => setEditingExpenseId(null)}
        copy={copy}
      />
    </>
  );
}
