import { pesosToCents } from "./currency";
import { inputValueToDate } from "./date";
import { isExpenseType } from "./expense-type";
import { parseMsiMonths } from "./msi";
import type { Dictionary } from "@/i18n/dictionaries";

export function readFields(formData: FormData) {
  return {
    description: String(formData.get("description") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    amount: String(formData.get("amount") ?? "").trim(),
    date: String(formData.get("date") ?? "").trim(),
    accountId: String(formData.get("accountId") ?? "").trim(),
    categoryId: String(formData.get("categoryId") ?? "").trim(),
    type: String(formData.get("type") ?? "").trim(),
    msi: formData.get("msi") === "on",
    msiMonths: String(formData.get("msiMonths") ?? "").trim(),
  };
}

export function validate(fields: ReturnType<typeof readFields>, t: Dictionary): string | null {
  if (!fields.description) return t.expenses.errors.descriptionRequired;
  if (!fields.accountId) return t.expenses.errors.accountRequired;
  const cents = pesosToCents(fields.amount);
  if (cents === null) return t.expenses.errors.invalidAmount;
  const date = inputValueToDate(fields.date);
  if (!date) return t.expenses.errors.invalidDate;
  if (!isExpenseType(fields.type)) return t.expenses.errors.typeRequired;
  if (fields.msi && parseMsiMonths(fields.msiMonths) === null) {
    return t.expenses.errors.invalidMsiMonths;
  }
  return null;
}

export type ExpenseChanges = Partial<{
  description: string;
  notes: string | null;
  amountCents: number;
  date: Date;
  accountId: string;
  categoryId: string | null;
  type: string;
}>;

export type EditableExpenseField =
  | "date"
  | "description"
  | "accountId"
  | "categoryId"
  | "type"
  | "amount";

export function expenseFieldChanges(
  field: EditableExpenseField,
  rawValue: string,
  t: Dictionary,
): { error: string } | { changes: ExpenseChanges } | undefined {
  const value = typeof rawValue === "string" ? rawValue.trim() : "";

  switch (field) {
    case "description": {
      if (!value) return { error: t.expenses.errors.descriptionRequired };
      return { changes: { description: value } };
    }
    case "amount": {
      const cents = pesosToCents(value);
      if (cents === null) return { error: t.expenses.errors.invalidAmount };
      return { changes: { amountCents: cents } };
    }
    case "date": {
      const date = inputValueToDate(value);
      if (!date) return { error: t.expenses.errors.invalidDate };
      return { changes: { date } };
    }
    case "accountId": {
      if (!value) return { error: t.expenses.errors.accountRequired };
      return { changes: { accountId: value } };
    }
    case "categoryId": {
      return { changes: { categoryId: value || null } };
    }
    case "type": {
      if (!isExpenseType(value)) return { error: t.expenses.errors.typeRequired };
      return { changes: { type: value } };
    }
  }
}
