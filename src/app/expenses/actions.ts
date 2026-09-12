"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pesosToCents } from "@/lib/currency";
import { inputValueToDate } from "@/lib/date";
import { isExpenseType } from "@/lib/expense-type";
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

  await prisma.expense.create({
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
  redirect("/expenses");
}

export async function updateExpense(
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
  redirect("/expenses");
}

export async function deleteExpense(id: string): Promise<void> {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
}
