"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBookWriter } from "@/lib/session";
import { pesosToCents } from "@/lib/currency";
import { inputValueToDate } from "@/lib/date";
import { buildMsiInstallmentRows, canUseMsi, isMsiInstallment, parseMsiMonths } from "@/lib/msi";
import { getTranslations } from "@/i18n/get-locale";
import { readFields, validate, expenseFieldChanges, type ExpenseChanges, type EditableExpenseField } from "@/lib/expense-validation";
import type { Dictionary } from "@/i18n/dictionaries";

export type ActionState = { error?: string; values?: ReturnType<typeof readFields> } | undefined;

export async function createExpense(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { book } = await requireBookWriter();
  const { t } = await getTranslations();
  const fields = readFields(formData);
  const error = validate(fields, t);
  if (error) return { error, values: fields };

  const cents = pesosToCents(fields.amount)!;
  const date = inputValueToDate(fields.date)!;
  const categoryId = fields.categoryId || null;

  try {
    if (fields.msi) {
      const account = await prisma.account.findUnique({ where: { id_bookId: { id: fields.accountId, bookId: book.id } } });
      if (!account) return { error: t.expenses.errors.invalidReference, values: fields };
      if (!canUseMsi(account)) return { error: t.expenses.errors.msiRequiresCutoffDay, values: fields };

      const months = parseMsiMonths(fields.msiMonths)!;
      const original = {
        description: fields.description,
        notes: fields.notes || null,
        amountCents: cents,
        date,
        accountId: fields.accountId,
        categoryId,
        type: fields.type,
        msiGroupId: crypto.randomUUID(),
      };

      await prisma.$transaction([
        prisma.expense.create({ data: { ...original, bookId: book.id, excludeFromTotals: true } }),
        prisma.expense.createMany({
          data: buildMsiInstallmentRows({ ...original, bookId: book.id }, months, account.cutoffDay),
        }),
      ]);
      revalidatePath("/expenses");
      return {};
    }

    await prisma.expense.create({
      data: {
        bookId: book.id,
        description: fields.description,
        notes: fields.notes || null,
        amountCents: cents,
        date,
        accountId: fields.accountId,
        categoryId,
        type: fields.type,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { error: t.expenses.errors.invalidReference, values: fields };
    }
    throw error;
  }
  revalidatePath("/expenses");
  return {};
}

async function applyExpenseChanges(
  id: string,
  bookId: string,
  changes: ExpenseChanges,
  t: Dictionary,
): Promise<ActionState> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUniqueOrThrow({ where: { id_bookId: { id, bookId } } });
      if (isMsiInstallment(expense)) return { error: t.expenses.errors.msiInstallmentLocked };

      const { msiGroupId } = expense;
      if (!msiGroupId) {
        await tx.expense.update({ where: { id_bookId: { id, bookId } }, data: changes });
      } else {
        const updated = { ...expense, ...changes, msiGroupId };
        const account = await tx.account.findUnique({ where: { id_bookId: { id: updated.accountId, bookId } } });
        if (!account) return { error: t.expenses.errors.invalidReference };
        if (!canUseMsi(account)) return { error: t.expenses.errors.msiRequiresCutoffDay };

        const installments = { msiGroupId, excludeFromTotals: false };
        const months = await tx.expense.count({ where: { ...installments, bookId } });
        await tx.expense.update({ where: { id_bookId: { id, bookId } }, data: changes });
        await tx.expense.deleteMany({ where: { ...installments, bookId } });
        await tx.expense.createMany({
          data: buildMsiInstallmentRows({ ...updated, bookId }, months, account.cutoffDay),
        });
      }
      return {};
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (result.error) return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") notFound();
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { error: t.expenses.errors.invalidReference };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { error: t.expenses.errors.conflict };
    }
    throw error;
  }

  revalidatePath("/expenses");
  return {};
}

export async function updateExpenseModal(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { book } = await requireBookWriter();
  const { t } = await getTranslations();
  const fields = readFields(formData);
  const error = validate(fields, t);
  if (error) return { error, values: fields };

  const cents = pesosToCents(fields.amount)!;
  const date = inputValueToDate(fields.date)!;

  const result = await applyExpenseChanges(
    id,
    book.id,
    {
      description: fields.description,
      notes: fields.notes || null,
      amountCents: cents,
      date,
      accountId: fields.accountId,
      categoryId: fields.categoryId || null,
      type: fields.type,
    },
    t,
  );
  return result?.error ? { ...result, values: fields } : result;
}

export type { EditableExpenseField } from "@/lib/expense-validation";

export async function updateExpenseField(
  id: string,
  field: EditableExpenseField,
  rawValue: string
): Promise<ActionState> {
  const { book } = await requireBookWriter();
  const { t } = await getTranslations();
  const result = expenseFieldChanges(field, rawValue, t);
  if (!result || "error" in result) return result;
  return applyExpenseChanges(id, book.id, result.changes, t);
}

export async function deleteExpense(id: string): Promise<void> {
  const { book } = await requireBookWriter();
  const expense = await prisma.expense.findUnique({ where: { id_bookId: { id, bookId: book.id } } });
  if (!expense) notFound();
  if (isMsiInstallment(expense)) return;
  if (expense.msiGroupId) {
    await prisma.expense.deleteMany({ where: { bookId: book.id, msiGroupId: expense.msiGroupId } });
  } else {
    try {
      await prisma.expense.delete({ where: { id_bookId: { id, bookId: book.id } } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") notFound();
      throw error;
    }
  }
  revalidatePath("/expenses");
}
