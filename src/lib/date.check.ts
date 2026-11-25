// Run: npx tsx src/lib/date.check.ts
import { currentMonthKey, dateToInputValue, expenseYears, formatDate, formatMonth, inputValueToDate, monthBounds, monthKey, monthNames, parseMonthKey } from "./date";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
const utcDate = new Date("2026-11-24T00:00:00Z");
assert(formatDate(utcDate) === "24 nov 2026", "GAS-16: default Spanish date uses UTC rather than the previous Mexican day");
assert(formatDate(utcDate, "es") === "24 nov 2026", "GAS-16: Spanish date uses UTC");
assert(formatDate(utcDate, "en") === "Nov 24, 2026", "GAS-16: English date uses UTC");
assert(dateToInputValue(utcDate) === "2026-11-24", "GAS-25/GAS-6: editing uses the UTC calendar date");
assert(dateToInputValue(new Date("2026-12-01T01:00:00+02:00")) === "2026-11-30", "GAS-25/GAS-6: editing converts an offset to UTC");
assert(inputValueToDate("2026-11-24")?.toISOString() === "2026-11-24T00:00:00.000Z", "GAS-6: date input is stored at UTC midnight");
for (const invalid of ["", "2026-1-01", "2026-01-1", "24/11/2026", " 2026-11-24 ", "2026-11-24T00:00:00Z", "2026-00-10", "2026-13-01"]) {
  assert(inputValueToDate(invalid) === null, `GAS-6: rejects invalid date input ${JSON.stringify(invalid)}`);
}
assert(monthKey(new Date("2026-01-01T00:00:00Z")) === "2026-01", "GAS-19: month keys pad January and use UTC");
assert(monthKey(new Date("2026-12-01T01:00:00+02:00")) === "2026-11", "GAS-19: month keys use the UTC month of an offset date");
assert(monthKey(new Date("0050-01-01T00:00:00Z")) === "0050-01", "GAS-19: month keys pad year 50 to four digits");
assert(monthKey(new Date("0000-12-01T00:00:00Z")) === "0000-12", "GAS-19: month keys pad year zero to four digits");
for (const [key, es, en] of [
  ["2026-11", "Noviembre 2026", "November 2026"],
  ["2026-01", "Enero 2026", "January 2026"],
  ["2026-12", "Diciembre 2026", "December 2026"],
] as const) {
  const month = parseMonthKey(key)!;
  assert(formatMonth(month) === es, `INI-2/GAS-20: ${key} defaults to capitalized Spanish without de`);
  assert(formatMonth(month, "es") === es, `INI-2/GAS-20: ${key} Spanish month and year have one space without de`);
  assert(formatMonth(month, "en") === en, `INI-2/GAS-20: ${key} English month starts with a capital`);
}
assert(formatMonth(new Date("2026-12-01T01:00:00+02:00"), "es") === "Noviembre 2026", "INI-2/GAS-20: Spanish month uses UTC across a month boundary");
assert(formatMonth(new Date("2026-12-01T01:00:00+02:00"), "en") === "November 2026", "INI-2/GAS-20: English month uses UTC across a month boundary");
assert(formatMonth(new Date("2026-01-01T01:00:00+02:00"), "en") === "December 2025", "INI-2/GAS-20: year uses UTC across a year boundary");
assert(formatMonth(parseMonthKey("0050-01")!, "es") === "Enero 50", "INI-2/GAS-20: Spanish early year is a plain number");
assert(formatMonth(parseMonthKey("0050-01")!, "en") === "January 50", "INI-2/GAS-20: English early year is a plain number");
assert(formatMonth(parseMonthKey("0000-01")!) === "Enero 0", "INI-2/GAS-20: year zero stays a plain number");
for (const locale of ["es", "en"] as const) {
  const months = monthNames(locale);
  assert(months.length === 12, `GAS-20: ${locale} has twelve month names`);
  assert(months.every((month, index) => month.value === String(index + 1).padStart(2, "0")), `GAS-20: ${locale} month values run from 01 to 12`);
  assert(months[0].label === (locale === "es" ? "Enero" : "January"), `GAS-20: ${locale} first month is capitalized`);
  assert(months[11].label === (locale === "es" ? "Diciembre" : "December"), `GAS-20: ${locale} last month is capitalized`);
}
const at = (iso: string) => currentMonthKey(new Date(iso));
const before = currentMonthKey(new Date());
const current = currentMonthKey();
const after = currentMonthKey(new Date());
assert(current === before || current === after, "GAS-19: omitted current time defaults to now, including across a month boundary");
assert(at("2026-12-01T00:30:00Z") === "2026-11", "GAS-19: 18:30 in Mexico on Nov 30 is still November");
assert(at("2026-12-01T05:59:00Z") === "2026-11", "GAS-19: 23:59 in Mexico on Nov 30 is still November");
assert(at("2026-12-01T06:00:00Z") === "2026-12", "GAS-19: midnight in Mexico starts December");
assert(at("2027-01-01T05:59:00Z") === "2026-12", "GAS-19: year boundary");

assert(parseMonthKey("0001-01")?.toISOString() === "0001-01-01T00:00:00.000Z", "GAS-19: early year is preserved exactly");
assert(parseMonthKey("0000-01")?.toISOString() === "0000-01-01T00:00:00.000Z", "GAS-19: year zero is preserved exactly");
assert(parseMonthKey("0099-12")?.toISOString() === "0099-12-01T00:00:00.000Z", "GAS-19: year 99 is preserved exactly");
assert(parseMonthKey("2026-01")?.toISOString() === "2026-01-01T00:00:00.000Z", "GAS-19: normal January is unchanged");
assert(parseMonthKey("2026-12")?.toISOString() === "2026-12-01T00:00:00.000Z", "GAS-19: normal December is unchanged");
assert(parseMonthKey("2026-00") === null, "GAS-19: month zero is invalid");
assert(parseMonthKey("2026-13") === null, "GAS-19: month thirteen is invalid");
assert(parseMonthKey("2026-1") === null, "GAS-19: month needs two digits");
assert(parseMonthKey("abcd-01") === null, "GAS-19: year must be numeric");

const earlyJanuary = monthBounds("0001-01");
assert(earlyJanuary.start.toISOString() === "0001-01-01T00:00:00.000Z", "GAS-19: early month start");
assert(earlyJanuary.endExclusive.toISOString() === "0001-02-01T00:00:00.000Z", "GAS-19: early month end keeps exact year");
assert(monthBounds("0099-12").endExclusive.toISOString() === "0100-01-01T00:00:00.000Z", "GAS-19: year 99 rolls into year 100");
const yearFifty = monthBounds("0050-01");
assert(yearFifty.start.toISOString() === "0050-01-01T00:00:00.000Z", "GAS-19: dashboard month starts in year 50");
assert(yearFifty.endExclusive.toISOString() === "0050-02-01T00:00:00.000Z", "GAS-19: dashboard month ends in year 50");

const november = monthBounds("2026-11");
assert(november.start.toISOString() === "2026-11-01T00:00:00.000Z", "GAS-19: month starts at UTC midnight");
assert(november.endExclusive.toISOString() === "2026-12-01T00:00:00.000Z", "GAS-19: exclusive next month");
const december = monthBounds("2026-12");
assert(december.start.toISOString() === "2026-12-01T00:00:00.000Z", "GAS-19: December start");
assert(december.endExclusive.toISOString() === "2027-01-01T00:00:00.000Z", "GAS-19: December rolls into next year");
const february = monthBounds("2028-02");
assert(february.start.toISOString() === "2028-02-01T00:00:00.000Z", "GAS-19: leap February start");
assert(february.endExclusive.toISOString() === "2028-03-01T00:00:00.000Z", "GAS-19: leap February end");

const date = (year: number) => new Date(`${String(year).padStart(4, "0")}-06-01T00:00:00Z`);
const years = (dates: Date[], selectedYear = 2026) => expenseYears(dates, 2026, selectedYear).join(",");
assert(years([], 2024) === "2024,2026", "GAS-21: no expenses includes current and selected years in ascending order");
assert(years([]) === "2026", "GAS-21: no expenses deduplicates current and selected years");
assert(years([date(2026), date(202)]) === "202,2026", "GAS-21: typo year 0202 adds exactly one option without filling gaps");
assert(years([date(2026), date(2024), date(2024), date(2026)]) === "2024,2026", "GAS-21: duplicate expense years collapse");
assert(years([date(2030), date(2028)]) === "2026,2028,2030", "GAS-21: future installment years are included without filling gaps");
assert(years([date(2024)], 2035) === "2024,2026,2035", "GAS-21: selected year outside expense data is included");
assert(years([new Date("2025-12-31T23:59:59Z")]) === "2025,2026", "GAS-21: last UTC second of 2025 belongs to 2025");
assert(years([new Date("2026-01-01T01:00:00+02:00")]) === "2025,2026", "GAS-21: offset dates use their UTC year");
assert(years([new Date("2025-01-01T00:00:00Z")]) === "2025,2026", "GAS-21: UTC midnight starts the new year");
console.log("date ok");
