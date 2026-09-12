import Link from "next/link";
import { SortIcon } from "./icons";
import type { SortDir } from "@/lib/sort";

export function SortableHeader({
  label,
  field,
  activeField,
  dir,
  basePath,
  query,
  align = "left",
}: {
  label: string;
  field: string;
  activeField: string;
  dir: SortDir;
  basePath: string;
  query?: Record<string, string | undefined>;
  align?: "left" | "right";
}) {
  const active = field === activeField;
  const nextDir: SortDir = active && dir === "asc" ? "desc" : "asc";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) params.set(key, value);
  }
  params.set("sort", field);
  params.set("dir", nextDir);

  return (
    <Link
      href={`${basePath}?${params.toString()}`}
      className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${
        align === "right" ? "flex-row-reverse" : ""
      } ${active ? "text-ink" : ""}`}
    >
      <span>{label}</span>
      <SortIcon direction={active ? dir : undefined} className="h-3 w-3 shrink-0" />
    </Link>
  );
}
