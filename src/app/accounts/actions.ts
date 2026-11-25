"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { readFields, validateAccount, accountFieldChanges, type EditableAccountField } from "@/lib/account-validation";
import { getTranslations } from "@/i18n/get-locale";

export type ActionState = { error?: string } | undefined;

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createAccount(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const { t } = await getTranslations();
  const { name, type, cutoffDay, paymentDay } = readFields(formData);
  const result = validateAccount({ name, type, cutoffDay, paymentDay }, t);
  if ("error" in result) return result;
  const { cutoffDayValue, paymentDayValue } = result;

  try {
    await prisma.account.create({
      data: { name, type, cutoffDay: cutoffDayValue, paymentDay: paymentDayValue },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t.accounts.errors.nameTaken };
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
  await requireUser();
  const { t } = await getTranslations();
  const { name, type, cutoffDay, paymentDay } = readFields(formData);
  const result = validateAccount({ name, type, cutoffDay, paymentDay }, t);
  if ("error" in result) return result;
  const { cutoffDayValue, paymentDayValue } = result;

  try {
    await prisma.account.update({
      where: { id },
      data: { name, type, cutoffDay: cutoffDayValue, paymentDay: paymentDayValue },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t.accounts.errors.nameTaken };
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
  await requireUser();
  const { t } = await getTranslations();
  const result = accountFieldChanges(field, rawValue, t);
  if (result && "error" in result) return result;

  if (result) {
    if (field === "name") {
      try {
        await prisma.account.update({ where: { id }, data: result.data });
      } catch (error) {
        if (isUniqueConstraintError(error)) return { error: t.accounts.errors.nameTaken };
        throw error;
      }
    } else {
      await prisma.account.update({ where: { id }, data: result.data });
    }
  }

  revalidatePath("/accounts");
  return {};
}

export async function deleteAccount(id: string): Promise<void> {
  await requireUser();
  const expenseCount = await prisma.expense.count({ where: { accountId: id } });
  if (expenseCount > 0) {
    redirect("/accounts?error=hasExpenses");
  }
  await prisma.account.delete({ where: { id } });
  revalidatePath("/accounts");
}
