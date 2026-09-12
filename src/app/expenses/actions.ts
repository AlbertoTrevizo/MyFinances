"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pesosToCents } from "@/lib/currency";
import { inputValueToDate } from "@/lib/date";
import { isExpenseType } from "@/lib/expense-type";
import { buildMsiInstallments, isValidMsiMonths } from "@/lib/msi";
import { getTranslations } from "@/i18n/get-locale";
import type { Dictionary } from "@/i18n/dictionaries";

export type ActionState = { error?: string } | undefined;

function readFields(formData: FormData) {
  return {
    description: String(formData.get("description") ?? "").trim(),
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
    const installments = buildMsiInstallments({
      totalCents: cents,
      months,
      purchaseDate: date,
      cutoffDay: account.cutoffDay,
    });
    const msiGroupId = crypto.randomUUID();

    await prisma.$transaction([
      prisma.expense.create({
        data: {
          description: fields.description,
          amountCents: cents,
          date,
          accountId: fields.accountId,
          categoryId,
          type: fields.type,
          excludeFromTotals: true,
          msiGroupId,
        },
      }),
      ...installments.map((installment) =>
        prisma.expense.create({
          data: {
            description: `${fields.description} ${installment.index}/${months}`,
            amountCents: installment.amountCents,
            date: installment.date,
            accountId: fields.accountId,
            categoryId,
            type: fields.type,
            excludeFromTotals: false,
            msiGroupId,
          },
        }),
      ),
    ]);
    revalidatePath("/expenses");
    redirect("/expenses");
  }

  await prisma.expense.create({
    data: {
      description: fields.description,
      amountCents: cents,
      date,
      accountId: fields.accountId,
      categoryId,
      type: fields.type,
    },
  });
  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function updateExpenseModal(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getTranslations();
  const fields = readFields(formData);
  const error = validate(fields, t);
  if (error) return { error };

  const cents = pesosToCents(fields.amount)!;
  const date = inputValueToDate(fields.date)!;

  await prisma.expense.update({
    where: { id },
    data: {
      description: fields.description,
      amountCents: cents,
      date,
      accountId: fields.accountId,
      categoryId: fields.categoryId || null,
      type: fields.type,
    },
  });
  revalidatePath("/expenses");
  return {};
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
  const { t } = await getTranslations();
  const value = rawValue.trim();

  switch (field) {
    case "description": {
      if (!value) return { error: t.expenses.errors.descriptionRequired };
      await prisma.expense.update({ where: { id }, data: { description: value } });
      break;
    }
    case "amount": {
      const cents = pesosToCents(value);
      if (cents === null) return { error: t.expenses.errors.invalidAmount };
      await prisma.expense.update({ where: { id }, data: { amountCents: cents } });
      break;
    }
    case "date": {
      const date = inputValueToDate(value);
      if (!date) return { error: t.expenses.errors.invalidDate };
      await prisma.expense.update({ where: { id }, data: { date } });
      break;
    }
    case "accountId": {
      if (!value) return { error: t.expenses.errors.accountRequired };
      await prisma.expense.update({ where: { id }, data: { accountId: value } });
      break;
    }
    case "categoryId": {
      await prisma.expense.update({ where: { id }, data: { categoryId: value || null } });
      break;
    }
    case "type": {
      if (!isExpenseType(value)) return { error: t.expenses.errors.typeRequired };
      await prisma.expense.update({ where: { id }, data: { type: value } });
      break;
    }
  }

  revalidatePath("/expenses");
  return {};
}

export async function deleteExpense(id: string): Promise<void> {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (expense?.excludeFromTotals && expense.msiGroupId) {
    await prisma.expense.deleteMany({ where: { msiGroupId: expense.msiGroupId } });
  } else {
    await prisma.expense.delete({ where: { id } });
  }
  revalidatePath("/expenses");
}
