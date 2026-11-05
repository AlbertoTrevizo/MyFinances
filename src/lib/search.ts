function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function matchesSearch(query: string, fields: (string | null | undefined)[]): boolean {
  const needle = normalize(query);
  return fields.some((field) => field != null && normalize(field).includes(needle));
}
