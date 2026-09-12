"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type ActionState = { error?: string } | undefined;

function readFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  return { name };
}

export async function createCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { name } = readFields(formData);
  if (!name) return { error: "El nombre es requerido." };

  await prisma.category.create({ data: { name } });
  revalidatePath("/categories");
  redirect("/categories");
}

export async function updateCategory(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { name } = readFields(formData);
  if (!name) return { error: "El nombre es requerido." };

  await prisma.category.update({ where: { id }, data: { name } });
  revalidatePath("/categories");
  redirect("/categories");
}

export async function deleteCategory(id: string): Promise<void> {
  const expenseCount = await prisma.expense.count({ where: { categoryId: id } });
  if (expenseCount > 0) {
    redirect(
      `/categories?error=${encodeURIComponent(
        "No puedes eliminar una categoría con gastos asociados."
      )}`
    );
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
}
