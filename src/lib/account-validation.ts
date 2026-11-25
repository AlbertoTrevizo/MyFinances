import type { Dictionary } from "@/i18n/dictionaries";

export function readFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const cutoffDay = String(formData.get("cutoffDay") ?? "").trim();
  const paymentDay = String(formData.get("paymentDay") ?? "").trim();
  return { name, type, cutoffDay, paymentDay };
}

export function parseDayOfMonth(value: string): number | null | undefined {
  if (!value) return null;
  const day = Number.parseInt(value, 10);
  if (!Number.isInteger(day) || day < 1 || day > 31) return undefined;
  return day;
}

export function validateAccount(
  { name, type, cutoffDay, paymentDay }: ReturnType<typeof readFields>,
  t: Dictionary,
): { error: string } | { cutoffDayValue: number | null; paymentDayValue: number | null } {
  if (!name) return { error: t.accounts.errors.nameRequired };
  if (!type) return { error: t.accounts.errors.typeRequired };
  const cutoffDayValue = parseDayOfMonth(cutoffDay);
  if (cutoffDayValue === undefined) return { error: t.accounts.errors.invalidCutoffDay };
  const paymentDayValue = parseDayOfMonth(paymentDay);
  if (paymentDayValue === undefined) return { error: t.accounts.errors.invalidPaymentDay };

  return { cutoffDayValue, paymentDayValue };
}

export type EditableAccountField = "name" | "type" | "cutoffDay" | "paymentDay";

export function accountFieldChanges(
  field: EditableAccountField,
  rawValue: string,
  t: Dictionary,
): { error: string } | { data: Partial<{ name: string; type: string; cutoffDay: number | null; paymentDay: number | null }> } | undefined {
  const value = typeof rawValue === "string" ? rawValue.trim() : "";

  switch (field) {
    case "name": {
      if (!value) return { error: t.accounts.errors.nameRequired };
      return { data: { name: value } };
    }
    case "type": {
      if (!value) return { error: t.accounts.errors.typeRequired };
      return { data: { type: value } };
    }
    case "cutoffDay": {
      const day = parseDayOfMonth(value);
      if (day === undefined) return { error: t.accounts.errors.invalidCutoffDay };
      return { data: { cutoffDay: day } };
    }
    case "paymentDay": {
      const day = parseDayOfMonth(value);
      if (day === undefined) return { error: t.accounts.errors.invalidPaymentDay };
      return { data: { paymentDay: day } };
    }
  }
}
