export type SortDir = "asc" | "desc";

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
