const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function formatCents(cents: number): string {
  return formatter.format(cents / 100);
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
