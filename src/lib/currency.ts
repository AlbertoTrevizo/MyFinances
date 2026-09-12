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

export function pesosToCents(value: string): number | null {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return null;
  const pesos = Number.parseFloat(normalized);
  if (Number.isNaN(pesos) || pesos <= 0) return null;
  return Math.round(pesos * 100);
}

export function pesosToCentsOrZero(value: string): number | null {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return 0;
  const pesos = Number.parseFloat(normalized);
  if (Number.isNaN(pesos) || pesos < 0) return null;
  return Math.round(pesos * 100);
}
