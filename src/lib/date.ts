import type { Locale } from "@/i18n/config";

const dateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  es: new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }),
};

export function formatDate(date: Date, locale: Locale = "es"): string {
  return dateFormatters[locale].format(date);
}

export function dateToInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function inputValueToDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
