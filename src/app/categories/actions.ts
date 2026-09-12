"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "@/i18n/get-locale";

export type ActionState = { error?: string } | undefined;

function readFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  return { name };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getTranslations();
  const { name } = readFields(formData);
  if (!name) return { error: t.categories.errors.nameRequired };

  try {
    await prisma.category.create({ data: { name } });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t.categories.errors.nameTaken };
    throw error;
  }
  revalidatePath("/categories");
  redirect("/categories");
}

export async function updateCategory(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getTranslations();
  const { name } = readFields(formData);
  if (!name) return { error: t.categories.errors.nameRequired };

  try {
    await prisma.category.update({ where: { id }, data: { name } });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t.categories.errors.nameTaken };
    throw error;
  }
  revalidatePath("/categories");
  redirect("/categories");
}

export async function deleteCategory(id: string): Promise<void> {
  const { t } = await getTranslations();
  const expenseCount = await prisma.expense.count({ where: { categoryId: id } });
  if (expenseCount > 0) {
    redirect(`/categories?error=${encodeURIComponent(t.categories.errors.hasExpenses)}`);
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
}
