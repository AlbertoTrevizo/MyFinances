export const MSI_MIN_MONTHS = 2;
export const MSI_MAX_MONTHS = 36;

export function isValidMsiMonths(value: number): boolean {
  return Number.isInteger(value) && value >= MSI_MIN_MONTHS && value <= MSI_MAX_MONTHS;
}

function cutoffDateForMonth(year: number, monthIndex0: number, cutoffDay: number): Date {
  const daysInMonth = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
  const day = Math.min(cutoffDay, daysInMonth);
  return new Date(Date.UTC(year, monthIndex0, day));
}

export function buildMsiInstallments({
  totalCents,
  months,
  purchaseDate,
  cutoffDay,
}: {
  totalCents: number;
  months: number;
  purchaseDate: Date;
  cutoffDay: number;
}): { index: number; amountCents: number; date: Date }[] {
  const purchaseDay = purchaseDate.getUTCDate();
  let year = purchaseDate.getUTCFullYear();
  let startMonthIndex0 = purchaseDate.getUTCMonth();

  // A purchase made after this month's cutoff lands on next month's statement.
  if (purchaseDay > cutoffDay) {
    startMonthIndex0 += 1;
    if (startMonthIndex0 > 11) {
      startMonthIndex0 = 0;
      year += 1;
    }
  }

  const base = Math.floor(totalCents / months);
  const remainder = totalCents - base * months;

  return Array.from({ length: months }, (_, i) => {
    const absoluteMonth = startMonthIndex0 + i;
    const y = year + Math.floor(absoluteMonth / 12);
    const monthIndex0 = ((absoluteMonth % 12) + 12) % 12;
    return {
      index: i + 1,
      amountCents: base + (i < remainder ? 1 : 0),
      date: cutoffDateForMonth(y, monthIndex0, cutoffDay),
    };
  });
}
