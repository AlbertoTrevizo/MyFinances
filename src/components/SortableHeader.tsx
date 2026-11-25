import Link from "next/link";
import { SortIcon } from "./icons";
import { sortHeader, type SortDir } from "@/lib/sort";

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
  const { active, href } = sortHeader(field, activeField, dir, basePath, query);

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${
        align === "right" ? "flex-row-reverse" : ""
      } ${active ? "text-ink" : ""}`}
    >
      <span>{label}</span>
      <SortIcon direction={active ? dir : undefined} className="h-3 w-3 shrink-0" />
    </Link>
  );
}
