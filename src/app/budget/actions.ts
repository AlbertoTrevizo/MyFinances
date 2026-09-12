"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pesosToCentsOrZero } from "@/lib/currency";
import { EXPENSE_TYPES } from "@/lib/expense-type";
import { getTranslations } from "@/i18n/get-locale";

export type ActionState = { error?: string } | undefined;

export async function saveBudgets(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getTranslations();

  const amounts: Record<(typeof EXPENSE_TYPES)[number], number> = {} as never;
  for (const type of EXPENSE_TYPES) {
    const raw = String(formData.get(type) ?? "").trim();
    const cents = pesosToCentsOrZero(raw);
    if (cents === null) return { error: t.budget.errors.invalidAmount };
    amounts[type] = cents;
  }

  await prisma.$transaction(
    EXPENSE_TYPES.map((type) =>
      prisma.budget.upsert({
        where: { type },
        update: { amountCents: amounts[type] },
        create: { type, amountCents: amounts[type] },
      }),
    ),
  );

  revalidatePath("/budget");
  revalidatePath("/");
  redirect("/budget");
}

export async function addCategoryBudget(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getTranslations();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const raw = String(formData.get("amount") ?? "").trim();

  if (!categoryId) return { error: t.budget.errors.categoryRequired };
  const cents = pesosToCentsOrZero(raw);
  if (cents === null) return { error: t.budget.errors.invalidAmount };

  await prisma.categoryBudget.upsert({
    where: { categoryId },
    update: { amountCents: cents },
    create: { categoryId, amountCents: cents },
  });

  revalidatePath("/budget");
  revalidatePath("/");
  redirect("/budget");
}

export async function updateCategoryBudget(
  categoryId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getTranslations();
  const raw = String(formData.get("amount") ?? "").trim();
  const cents = pesosToCentsOrZero(raw);
  if (cents === null) return { error: t.budget.errors.invalidAmount };

  await prisma.categoryBudget.update({
    where: { categoryId },
    data: { amountCents: cents },
  });

  revalidatePath("/budget");
  revalidatePath("/");
  redirect("/budget");
}

export async function deleteCategoryBudget(categoryId: string): Promise<void> {
  await prisma.categoryBudget.delete({ where: { categoryId } });
  revalidatePath("/budget");
  revalidatePath("/");
}
