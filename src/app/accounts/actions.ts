"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "@/i18n/get-locale";

export type ActionState = { error?: string } | undefined;

function readFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const cutoffDay = String(formData.get("cutoffDay") ?? "").trim();
  const paymentDay = String(formData.get("paymentDay") ?? "").trim();
  return { name, type, cutoffDay, paymentDay };
}

function parseDayOfMonth(value: string): number | null | undefined {
  if (!value) return null;
  const day = Number.parseInt(value, 10);
  if (!Number.isInteger(day) || day < 1 || day > 31) return undefined;
  return day;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createAccount(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getTranslations();
  const { name, type, cutoffDay, paymentDay } = readFields(formData);
  if (!name) return { error: t.accounts.errors.nameRequired };
  if (!type) return { error: t.accounts.errors.typeRequired };
  const cutoffDayValue = parseDayOfMonth(cutoffDay);
  if (cutoffDayValue === undefined) return { error: t.accounts.errors.invalidCutoffDay };
  const paymentDayValue = parseDayOfMonth(paymentDay);
  if (paymentDayValue === undefined) return { error: t.accounts.errors.invalidPaymentDay };

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
  const { t } = await getTranslations();
  const { name, type, cutoffDay, paymentDay } = readFields(formData);
  if (!name) return { error: t.accounts.errors.nameRequired };
  if (!type) return { error: t.accounts.errors.typeRequired };
  const cutoffDayValue = parseDayOfMonth(cutoffDay);
  if (cutoffDayValue === undefined) return { error: t.accounts.errors.invalidCutoffDay };
  const paymentDayValue = parseDayOfMonth(paymentDay);
  if (paymentDayValue === undefined) return { error: t.accounts.errors.invalidPaymentDay };

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

export type EditableAccountField = "name" | "type" | "cutoffDay" | "paymentDay";

export async function updateAccountField(
  id: string,
  field: EditableAccountField,
  rawValue: string
): Promise<ActionState> {
  const { t } = await getTranslations();
  const value = rawValue.trim();

  switch (field) {
    case "name": {
      if (!value) return { error: t.accounts.errors.nameRequired };
      try {
        await prisma.account.update({ where: { id }, data: { name: value } });
      } catch (error) {
        if (isUniqueConstraintError(error)) return { error: t.accounts.errors.nameTaken };
        throw error;
      }
      break;
    }
    case "type": {
      if (!value) return { error: t.accounts.errors.typeRequired };
      await prisma.account.update({ where: { id }, data: { type: value } });
      break;
    }
    case "cutoffDay": {
      const day = parseDayOfMonth(value);
      if (day === undefined) return { error: t.accounts.errors.invalidCutoffDay };
      await prisma.account.update({ where: { id }, data: { cutoffDay: day } });
      break;
    }
    case "paymentDay": {
      const day = parseDayOfMonth(value);
      if (day === undefined) return { error: t.accounts.errors.invalidPaymentDay };
      await prisma.account.update({ where: { id }, data: { paymentDay: day } });
      break;
    }
  }

  revalidatePath("/accounts");
  return {};
}

export async function deleteAccount(id: string): Promise<void> {
  const { t } = await getTranslations();
  const expenseCount = await prisma.expense.count({ where: { accountId: id } });
  if (expenseCount > 0) {
    redirect(`/accounts?error=${encodeURIComponent(t.accounts.errors.hasExpenses)}`);
  }
  await prisma.account.delete({ where: { id } });
  revalidatePath("/accounts");
}
