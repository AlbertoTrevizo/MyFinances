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

export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function parseMonthKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

const monthFormatters: Record<Locale, Intl.DateTimeFormat> = {
  es: new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
};

export function formatMonth(date: Date, locale: Locale = "es"): string {
  const label = monthFormatters[locale].format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
