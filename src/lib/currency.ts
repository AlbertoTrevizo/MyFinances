import type { Locale } from "@/i18n/config";

const formatters: Record<Locale, Intl.NumberFormat> = {
  es: new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }),
  en: new Intl.NumberFormat("en-US", { style: "currency", currency: "MXN" }),
};

export function formatCents(cents: number, locale: Locale = "es"): string {
  return formatters[locale].format(cents / 100);
}

export function centsToPesosInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

// Plain decimal pesos with up to 2 decimals (commas allowed), and small enough for the Int cents column.
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const MAX_CENTS = 2_147_483_647;

function parseCents(value: string): number | null {
  const normalized = value.replace(/,/g, "").trim();
  if (!AMOUNT_PATTERN.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return cents <= MAX_CENTS ? cents : null;
}

export function pesosToCents(value: string): number | null {
  const cents = parseCents(value);
  return cents && cents > 0 ? cents : null;
}

export function pesosToCentsOrZero(value: string): number | null {
  if (!value.replace(/,/g, "").trim()) return 0;
  return parseCents(value);
}

