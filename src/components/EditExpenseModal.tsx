"use client";

import { Modal } from "./Modal";
import { ExpenseForm } from "@/app/expenses/ExpenseForm";
import { updateExpenseModal } from "@/app/expenses/actions";
import { centsToPesosInput } from "@/lib/currency";
import { dateToInputValue } from "@/lib/date";
import type { ExpensesTableCopy } from "./ExpensesTable";

type Option = { id: string; label: string };

type ExpenseForEdit = {
  id: string;
  description: string;
  amountCents: number;
  date: Date;
  accountId: string;
  categoryId: string | null;
  type: string | null;
};

export function EditExpenseModal({
  expense,
  accounts,
  categories,
  onClose,
  copy,
}: {
  expense: ExpenseForEdit;
  accounts: Option[];
  categories: Option[];
  onClose: () => void;
  copy: ExpensesTableCopy;
}) {
  return (
    <Modal
      onClose={onClose}
      title={<h2 className="mb-4 text-lg font-semibold text-ink">{copy.editTitle}</h2>}
    >
      <ExpenseForm
        action={updateExpenseModal.bind(null, expense.id)}
        accounts={accounts}
        categories={categories}
        defaultValues={{
          description: expense.description,
          amount: centsToPesosInput(expense.amountCents),
          date: dateToInputValue(expense.date),
          accountId: expense.accountId,
          categoryId: expense.categoryId ?? "",
          type: expense.type ?? "",
        }}
        submitLabel={copy.editSubmit}
        form={copy.form}
        noCategory={copy.noCategory}
        expenseTypes={copy.expenseTypes}
        saving={copy.savingLabel}
        onSuccess={onClose}
      />
    </Modal>
  );
}
