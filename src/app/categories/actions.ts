"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBookWriter } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";

export type ActionState = { error?: string; values?: { name: string } } | undefined;

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
  const { book } = await requireBookWriter();
  const { t } = await getTranslations();
  const values = readFields(formData);
  const { name } = values;
  if (!name) return { error: t.categories.errors.nameRequired, values };

  try {
    await prisma.category.create({ data: { bookId: book.id, name } });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t.categories.errors.nameTaken, values };
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
  const { book } = await requireBookWriter();
  const { t } = await getTranslations();
  const values = readFields(formData);
  const { name } = values;
  if (!name) return { error: t.categories.errors.nameRequired, values };

  try {
    await prisma.category.update({ where: { id_bookId: { id, bookId: book.id } }, data: { name } });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t.categories.errors.nameTaken, values };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") notFound();
    throw error;
  }
  revalidatePath("/categories");
  redirect("/categories");
}

export async function deleteCategory(id: string): Promise<void> {
  const { book } = await requireBookWriter();
  const expenseCount = await prisma.expense.count({ where: { bookId: book.id, categoryId: id } });
  if (expenseCount > 0) {
    redirect("/categories?error=hasExpenses");
  }
  try {
    await prisma.category.delete({ where: { id_bookId: { id, bookId: book.id } } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") notFound();
    throw error;
  }
  revalidatePath("/categories");
}
