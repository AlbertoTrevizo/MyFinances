"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { pesosToCents } from "@/lib/currency";
import { inputValueToDate } from "@/lib/date";
import { isExpenseType } from "@/lib/expense-type";
import { buildMsiInstallmentRows, isMsiInstallment, isValidMsiMonths } from "@/lib/msi";
import { getTranslations } from "@/i18n/get-locale";
import type { Dictionary } from "@/i18n/dictionaries";

export type ActionState = { error?: string } | undefined;

function readFields(formData: FormData) {
  return {
    description: String(formData.get("description") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    amount: String(formData.get("amount") ?? "").trim(),
    date: String(formData.get("date") ?? "").trim(),
    accountId: String(formData.get("accountId") ?? "").trim(),
    categoryId: String(formData.get("categoryId") ?? "").trim(),
    type: String(formData.get("type") ?? "").trim(),
    msi: formData.get("msi") === "on",
    msiMonths: String(formData.get("msiMonths") ?? "").trim(),
  };
}

function validate(fields: ReturnType<typeof readFields>, t: Dictionary): string | null {
  if (!fields.description) return t.expenses.errors.descriptionRequired;
  if (!fields.accountId) return t.expenses.errors.accountRequired;
  const cents = pesosToCents(fields.amount);
  if (cents === null) return t.expenses.errors.invalidAmount;
  const date = inputValueToDate(fields.date);
  if (!date) return t.expenses.errors.invalidDate;
  if (!isExpenseType(fields.type)) return t.expenses.errors.typeRequired;
  if (fields.msi && !isValidMsiMonths(Number.parseInt(fields.msiMonths, 10))) {
    return t.expenses.errors.invalidMsiMonths;
  }
  return null;
}

export async function createExpense(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const { t } = await getTranslations();
  const fields = readFields(formData);
  const error = validate(fields, t);
  if (error) return { error };

  const cents = pesosToCents(fields.amount)!;
  const date = inputValueToDate(fields.date)!;
  const categoryId = fields.categoryId || null;

  if (fields.msi) {
    const account = await prisma.account.findUnique({ where: { id: fields.accountId } });
    if (!account?.cutoffDay) return { error: t.expenses.errors.msiRequiresCutoffDay };

    const months = Number.parseInt(fields.msiMonths, 10);
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

type ExpenseChanges = Partial<{
  description: string;
  notes: string | null;
  amountCents: number;
  date: Date;
  accountId: string;
  categoryId: string | null;
  type: string;
}>;

async function applyExpenseChanges(
  id: string,
  changes: ExpenseChanges,
  t: Dictionary,
): Promise<ActionState> {
  const expense = await prisma.expense.findUniqueOrThrow({ where: { id } });
  if (isMsiInstallment(expense)) return { error: t.expenses.errors.msiInstallmentLocked };

  const { msiGroupId } = expense;
  if (!msiGroupId) {
    await prisma.expense.update({ where: { id }, data: changes });
  } else {
    const updated = { ...expense, ...changes, msiGroupId };
    const account = await prisma.account.findUnique({ where: { id: updated.accountId } });
    if (!account?.cutoffDay) return { error: t.expenses.errors.msiRequiresCutoffDay };

    const installments = { msiGroupId, excludeFromTotals: false };
    const months = await prisma.expense.count({ where: installments });
    await prisma.$transaction([
      prisma.expense.update({ where: { id }, data: changes }),
      prisma.expense.deleteMany({ where: installments }),
      prisma.expense.createMany({
        data: buildMsiInstallmentRows(updated, months, account.cutoffDay),
      }),
    ]);
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
  if (error) return { error };

  const cents = pesosToCents(fields.amount)!;
  const date = inputValueToDate(fields.date)!;

  return applyExpenseChanges(
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
}

export type EditableExpenseField =
  | "date"
  | "description"
  | "accountId"
  | "categoryId"
  | "type"
  | "amount";

export async function updateExpenseField(
  id: string,
  field: EditableExpenseField,
  rawValue: string
): Promise<ActionState> {
  await requireUser();
  const { t } = await getTranslations();
  const value = typeof rawValue === "string" ? rawValue.trim() : "";

  switch (field) {
    case "description": {
      if (!value) return { error: t.expenses.errors.descriptionRequired };
      return applyExpenseChanges(id, { description: value }, t);
    }
    case "amount": {
      const cents = pesosToCents(value);
      if (cents === null) return { error: t.expenses.errors.invalidAmount };
      return applyExpenseChanges(id, { amountCents: cents }, t);
    }
    case "date": {
      const date = inputValueToDate(value);
      if (!date) return { error: t.expenses.errors.invalidDate };
      return applyExpenseChanges(id, { date }, t);
    }
    case "accountId": {
      if (!value) return { error: t.expenses.errors.accountRequired };
      return applyExpenseChanges(id, { accountId: value }, t);
    }
    case "categoryId": {
      return applyExpenseChanges(id, { categoryId: value || null }, t);
    }
    case "type": {
      if (!isExpenseType(value)) return { error: t.expenses.errors.typeRequired };
      return applyExpenseChanges(id, { type: value }, t);
    }
  }
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
