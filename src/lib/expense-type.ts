export const EXPENSE_TYPES = ["needs", "wants", "savings"] as const;

export type ExpenseType = (typeof EXPENSE_TYPES)[number];

export function isExpenseType(value: unknown): value is ExpenseType {
  return EXPENSE_TYPES.includes(value as ExpenseType);
}
