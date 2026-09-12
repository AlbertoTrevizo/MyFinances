import Link from "next/link";
import { SortIcon } from "./icons";
import type { SortDir } from "@/lib/sort";

export function SortableHeader({
  label,
  field,
  activeField,
  dir,
  basePath,
  align = "left",
}: {
  label: string;
  field: string;
  activeField: string;
  dir: SortDir;
  basePath: string;
  align?: "left" | "right";
}) {
  const active = field === activeField;
  const nextDir: SortDir = active && dir === "asc" ? "desc" : "asc";

  return (
    <Link
      href={`${basePath}?sort=${field}&dir=${nextDir}`}
      className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${
        align === "right" ? "flex-row-reverse" : ""
      } ${active ? "text-ink" : ""}`}
    >
      <span>{label}</span>
      <SortIcon direction={active ? dir : undefined} className="h-3 w-3 shrink-0" />
    </Link>
  );
}
