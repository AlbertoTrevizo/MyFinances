"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
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
  await requireUser();
  const { t } = await getTranslations();
  const fields = readFields(formData);
  const error = validate(fields, t);
  if (error) return { error, values: fields };

  const cents = pesosToCents(fields.amount)!;
  const date = inputValueToDate(fields.date)!;
  const categoryId = fields.categoryId || null;

  if (fields.msi) {
    const account = await prisma.account.findUnique({ where: { id: fields.accountId } });
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
      prisma.expense.create({ data: { ...original, excludeFromTotals: true } }),
      prisma.expense.createMany({
        data: buildMsiInstallmentRows(original, months, account.cutoffDay),
      }),
    ]);
    revalidatePath("/expenses");
    return {};
  }

  await prisma.expense.create({
    data: {
      description: fields.description,
      notes: fields.notes || null,
      amountCents: cents,
      date,
      accountId: fields.accountId,
      categoryId,
      type: fields.type,
    },
  });
  revalidatePath("/expenses");
  return {};
}

async function applyExpenseChanges(
  id: string,
  changes: ExpenseChanges,
  t: Dictionary,
): Promise<ActionState> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUniqueOrThrow({ where: { id } });
      if (isMsiInstallment(expense)) return { error: t.expenses.errors.msiInstallmentLocked };

      const { msiGroupId } = expense;
      if (!msiGroupId) {
        await tx.expense.update({ where: { id }, data: changes });
      } else {
        const updated = { ...expense, ...changes, msiGroupId };
        const account = await tx.account.findUnique({ where: { id: updated.accountId } });
        if (!canUseMsi(account)) return { error: t.expenses.errors.msiRequiresCutoffDay };

        const installments = { msiGroupId, excludeFromTotals: false };
        const months = await tx.expense.count({ where: installments });
        await tx.expense.update({ where: { id }, data: changes });
        await tx.expense.deleteMany({ where: installments });
        await tx.expense.createMany({
          data: buildMsiInstallmentRows(updated, months, account.cutoffDay),
        });
      }
      return {};
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (result.error) return result;
  } catch (error) {
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
  await requireUser();
  const { t } = await getTranslations();
  const fields = readFields(formData);
  const error = validate(fields, t);
  if (error) return { error, values: fields };

  const cents = pesosToCents(fields.amount)!;
  const date = inputValueToDate(fields.date)!;

  const result = await applyExpenseChanges(
    id,
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
  await requireUser();
  const { t } = await getTranslations();
  const result = expenseFieldChanges(field, rawValue, t);
  if (!result || "error" in result) return result;
  return applyExpenseChanges(id, result.changes, t);
}

export async function deleteExpense(id: string): Promise<void> {
  await requireUser();
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (expense && isMsiInstallment(expense)) return;
  if (expense?.msiGroupId) {
    await prisma.expense.deleteMany({ where: { msiGroupId: expense.msiGroupId } });
  } else {
    await prisma.expense.delete({ where: { id } });
  }
  revalidatePath("/expenses");
}
