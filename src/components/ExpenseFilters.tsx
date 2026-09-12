"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
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
  const router = useRouter();
  const pathname = usePathname();
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(q);
  const [prevQ, setPrevQ] = useState(q);
  const [, startTransition] = useTransition();
  const isFirstRender = useRef(true);

  if (q !== prevQ) {
    setPrevQ(q);
    setSearch(q);
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (fromRef.current?.value) params.set("from", fromRef.current.value);
      if (toRef.current?.value) params.set("to", toRef.current.value);
      params.set("sort", sort);
      params.set("dir", dir);

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className={inputField}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{t.fromLabel}</span>
        <input ref={fromRef} type="date" name="from" defaultValue={from} className={inputField} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{t.toLabel}</span>
        <input ref={toRef} type="date" name="to" defaultValue={to} className={inputField} />
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
