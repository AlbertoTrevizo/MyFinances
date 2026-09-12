import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary, card, inputField } from "@/lib/styles";
import type { SortDir } from "@/lib/sort";

export function ExpenseFilters({
  q,
  from,
  to,
  sort,
  dir,
  t,
}: {
  q: string;
  from: string;
  to: string;
  sort: string;
  dir: SortDir;
  t: Dictionary["expenses"]["filters"];
}) {
  const hasFilters = Boolean(q || from || to);

  return (
    <form
      method="get"
      action="/expenses"
      className={`flex flex-wrap items-end gap-3 ${card} p-4`}
    >
      <input type="hidden" name="sort" value={sort} />
      <input type="hidden" name="dir" value={dir} />

      <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{t.searchLabel}</span>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t.searchPlaceholder}
          className={inputField}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{t.fromLabel}</span>
        <input type="date" name="from" defaultValue={from} className={inputField} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{t.toLabel}</span>
        <input type="date" name="to" defaultValue={to} className={inputField} />
      </label>

      <button type="submit" className={buttonPrimary}>
        {t.apply}
      </button>

      {hasFilters && (
        <Link
          href="/expenses"
          className="text-sm font-medium text-ink-muted underline underline-offset-2 hover:text-ink"
        >
          {t.clear}
        </Link>
      )}
    </form>
  );
}
