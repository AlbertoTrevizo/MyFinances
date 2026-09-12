"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pesosToCents } from "@/lib/currency";
import { inputValueToDate } from "@/lib/date";

export type ActionState = { error?: string } | undefined;

function readFields(formData: FormData) {
  return {
    description: String(formData.get("description") ?? "").trim(),
    amount: String(formData.get("amount") ?? "").trim(),
    date: String(formData.get("date") ?? "").trim(),
    accountId: String(formData.get("accountId") ?? "").trim(),
    categoryId: String(formData.get("categoryId") ?? "").trim(),
  };
}

function validate(fields: ReturnType<typeof readFields>) {
  if (!fields.description) return "La descripción es requerida.";
  if (!fields.accountId) return "Selecciona una cuenta.";
  if (!fields.categoryId) return "Selecciona una categoría.";
  const cents = pesosToCents(fields.amount);
  if (cents === null) return "El monto debe ser un número mayor a cero.";
  const date = inputValueToDate(fields.date);
  if (!date) return "La fecha no es válida.";
  return null;
}

export async function createExpense(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const fields = readFields(formData);
  const error = validate(fields);
  if (error) return { error };

  const cents = pesosToCents(fields.amount)!;
  const date = inputValueToDate(fields.date)!;

  await prisma.expense.create({
    data: {
      description: fields.description,
      amountCents: cents,
      date,
      accountId: fields.accountId,
      categoryId: fields.categoryId,
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
  const fields = readFields(formData);
  const error = validate(fields);
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
      categoryId: fields.categoryId,
    },
  });
  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function deleteExpense(id: string): Promise<void> {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
}
