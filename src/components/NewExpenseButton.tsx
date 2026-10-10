"use client";

import Link from "next/link";
import { useState } from "react";
import { Modal } from "./Modal";
import { ExpenseForm } from "@/app/expenses/ExpenseForm";
import { createExpense } from "@/app/expenses/actions";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary } from "@/lib/styles";

type Option = { id: string; label: string; cutoffDay?: number | null };

export function NewExpenseButton({
  accounts,
  categories,
  copy,
}: {
  accounts: Option[];
  categories: Option[];
  copy: {
    newButton: string;
    newTitle: string;
    needsAccount: string;
    createAccountLink: string;
    createSubmit: string;
    noCategory: string;
    saving: string;
    form: Dictionary["expenses"]["form"];
    expenseTypes: Dictionary["expenseTypes"];
  };
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonPrimary}>
        {copy.newButton}
      </button>

      {open && (
        <Modal
          onClose={close}
          title={<h2 className="mb-4 text-lg font-semibold text-ink">{copy.newTitle}</h2>}
        >
          {accounts.length === 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink-muted">{copy.needsAccount}</p>
              <Link
                href="/accounts/new"
                className="w-fit text-sm font-medium text-primary underline underline-offset-2"
              >
                {copy.createAccountLink}
              </Link>
            </div>
          ) : (
            <ExpenseForm
              action={createExpense}
              accounts={accounts}
              categories={categories}
              submitLabel={copy.createSubmit}
              form={copy.form}
              noCategory={copy.noCategory}
              expenseTypes={copy.expenseTypes}
              allowMsi
              saving={copy.saving}
              onSuccess={close}
            />
          )}
        </Modal>
      )}
    </>
  );
}
