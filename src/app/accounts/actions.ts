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
  return { name, type };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createAccount(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getTranslations();
  const { name, type } = readFields(formData);
  if (!name) return { error: t.accounts.errors.nameRequired };
  if (!type) return { error: t.accounts.errors.typeRequired };

  try {
    await prisma.account.create({ data: { name, type } });
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
  const { name, type } = readFields(formData);
  if (!name) return { error: t.accounts.errors.nameRequired };
  if (!type) return { error: t.accounts.errors.typeRequired };

  try {
    await prisma.account.update({ where: { id }, data: { name, type } });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t.accounts.errors.nameTaken };
    throw error;
  }
  revalidatePath("/accounts");
  redirect("/accounts");
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
