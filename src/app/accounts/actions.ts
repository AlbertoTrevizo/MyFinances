"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBookWriter } from "@/lib/session";
import { readFields, validateAccount, accountFieldChanges, type EditableAccountField } from "@/lib/account-validation";
import { getTranslations } from "@/i18n/get-locale";

export type ActionState = { error?: string; values?: ReturnType<typeof readFields> } | undefined;

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createAccount(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { book } = await requireBookWriter();
  const { t } = await getTranslations();
  const values = readFields(formData);
  const { name, type, cutoffDay, paymentDay } = values;
  const result = validateAccount({ name, type, cutoffDay, paymentDay }, t);
  if ("error" in result) return { ...result, values };
  const { cutoffDayValue, paymentDayValue } = result;

  try {
    await prisma.account.create({
      data: { bookId: book.id, name, type, cutoffDay: cutoffDayValue, paymentDay: paymentDayValue },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t.accounts.errors.nameTaken, values };
    throw error;
  }
  revalidatePath("/accounts");
  redirect("/accounts");
}

export async function updateAccount(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { book } = await requireBookWriter();
  const { t } = await getTranslations();
  const values = readFields(formData);
  const { name, type, cutoffDay, paymentDay } = values;
  const result = validateAccount({ name, type, cutoffDay, paymentDay }, t);
  if ("error" in result) return { ...result, values };
  const { cutoffDayValue, paymentDayValue } = result;

  try {
    await prisma.account.update({
      where: { id_bookId: { id, bookId: book.id } },
      data: { name, type, cutoffDay: cutoffDayValue, paymentDay: paymentDayValue },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t.accounts.errors.nameTaken, values };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") notFound();
    throw error;
  }
  revalidatePath("/accounts");
  redirect("/accounts");
}

export type { EditableAccountField } from "@/lib/account-validation";

export async function updateAccountField(
  id: string,
  field: EditableAccountField,
  rawValue: string
): Promise<ActionState> {
  const { book } = await requireBookWriter();
  const { t } = await getTranslations();
  const result = accountFieldChanges(field, rawValue, t);
  if (result && "error" in result) return result;

  if (result) {
    try {
      await prisma.account.update({ where: { id_bookId: { id, bookId: book.id } }, data: result.data });
    } catch (error) {
      if (isUniqueConstraintError(error)) return { error: t.accounts.errors.nameTaken };
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") notFound();
      throw error;
    }
  }

  revalidatePath("/accounts");
  return {};
}

export async function deleteAccount(id: string): Promise<void> {
  const { book } = await requireBookWriter();
  const expenseCount = await prisma.expense.count({ where: { bookId: book.id, accountId: id } });
  if (expenseCount > 0) {
    redirect("/accounts?error=hasExpenses");
  }
  try {
    await prisma.account.delete({ where: { id_bookId: { id, bookId: book.id } } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") notFound();
    throw error;
  }
  revalidatePath("/accounts");
}
