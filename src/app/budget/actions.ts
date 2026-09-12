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
