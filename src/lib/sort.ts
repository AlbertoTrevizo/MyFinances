export type SortDir = "asc" | "desc";

export function sortHeader(
  field: string,
  activeField: string,
  dir: SortDir,
  basePath: string,
  query?: Record<string, string | undefined>,
) {
  const active = field === activeField;
  const nextDir: SortDir = active && dir === "asc" ? "desc" : "asc";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, value);
  }
  params.set("sort", field);
  params.set("dir", nextDir);
  return { active, href: `${basePath}?${params.toString()}` };
}

export function resolveSort<F extends string>(
  params: { sort?: string; dir?: string },
  fields: readonly F[],
  defaultField: F,
  defaultDir: SortDir = "asc",
): { field: F; dir: SortDir } {
  const field = fields.includes(params.sort as F) ? (params.sort as F) : defaultField;
  const dir: SortDir = params.dir === "asc" || params.dir === "desc" ? params.dir : defaultDir;
  return { field, dir };
}
