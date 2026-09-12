"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type ActionState = { error?: string } | undefined;

function readFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  return { name, type };
}

export async function createAccount(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { name, type } = readFields(formData);
  if (!name) return { error: "El nombre es requerido." };
  if (!type) return { error: "El tipo es requerido." };

  await prisma.account.create({ data: { name, type } });
  revalidatePath("/accounts");
  redirect("/accounts");
}

export async function updateAccount(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { name, type } = readFields(formData);
  if (!name) return { error: "El nombre es requerido." };
  if (!type) return { error: "El tipo es requerido." };

  await prisma.account.update({ where: { id }, data: { name, type } });
  revalidatePath("/accounts");
  redirect("/accounts");
}

export async function deleteAccount(id: string): Promise<void> {
  const expenseCount = await prisma.expense.count({ where: { accountId: id } });
  if (expenseCount > 0) {
    redirect(
      `/accounts?error=${encodeURIComponent(
        "No puedes eliminar una cuenta con gastos asociados."
      )}`
    );
  }
  await prisma.account.delete({ where: { id } });
  revalidatePath("/accounts");
}
