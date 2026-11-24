"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { card, inputField } from "@/lib/styles";
import type { SortDir } from "@/lib/sort";

export function ExpenseFilters({
  q,
  month,
  currentMonth,
  monthLabel,
  months,
  years,
  sort,
  dir,
  t,
}: {
  q: string;
  month: string;
  currentMonth: string;
  monthLabel: string;
  months: { value: string; label: string }[];
  years: number[];
  sort: string;
  dir: SortDir;
  t: Dictionary["expenses"]["filters"];
}) {
  const router = useRouter();
  const pickerRef = useRef<HTMLDetailsElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [search, setSearch] = useState(q);
  const [prevQ, setPrevQ] = useState(q);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [prevMonth, setPrevMonth] = useState(month);

  if (q !== prevQ) {
    setPrevQ(q);
    setSearch(q);
  }

  if (month !== prevMonth) {
    setPrevMonth(month);
    setSelectedMonth(month);
  }

  const navigate = useCallback((nextSearch: string, nextMonth: string) => {
    const params = new URLSearchParams({ month: nextMonth, sort, dir });
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    router.push(`/expenses?${params.toString()}`);
  }, [router, sort, dir]);

  useEffect(() => {
    if (search.trim() === q) return;
    searchTimeout.current = setTimeout(() => navigate(search, selectedMonth), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search, q, selectedMonth, navigate]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      const picker = pickerRef.current;
      if (picker && event.target instanceof Node && !picker.contains(event.target)) {
        picker.open = false;
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && pickerRef.current?.open) {
        pickerRef.current.open = false;
        pickerRef.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("click", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function changeMonth(nextMonth: string) {
    clearTimeout(searchTimeout.current);
    setSelectedMonth(nextMonth);
    navigate(search, nextMonth);
  }

  const [selectedYear, selectedMonthNumber] = selectedMonth.split("-");
  const hasFilters = Boolean(q || month !== currentMonth);

  return (
    <div className={`flex flex-wrap items-end gap-3 ${card} p-4`}>
      <label className="flex min-w-0 basis-full flex-col gap-1.5 sm:flex-1">
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

      <details ref={pickerRef} className="relative w-full sm:w-auto">
        <summary className={`${inputField} cursor-pointer`}>{monthLabel}</summary>
        <div className={`absolute left-0 z-10 mt-2 grid w-full grid-cols-2 gap-3 ${card} p-3 sm:left-auto sm:right-0 sm:w-72`}>
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-muted">{t.monthLabel}</span>
            <select
              value={selectedMonthNumber}
              onChange={(e) => changeMonth(`${selectedYear}-${e.target.value}`)}
              className={`${inputField} min-w-0 capitalize`}
            >
              {months.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-muted">{t.yearLabel}</span>
            <select
              value={selectedYear}
              onChange={(e) => changeMonth(`${e.target.value.padStart(4, "0")}-${selectedMonthNumber}`)}
              className={`${inputField} min-w-0`}
            >
              {years.map((year) => <option key={year} value={String(year).padStart(4, "0")}>{year}</option>)}
            </select>
          </label>
        </div>
      </details>

      {hasFilters && (
        <Link
          href="/expenses"
          className="text-sm font-medium text-ink-muted underline underline-offset-2 hover:text-ink"
        >
          {t.clear}
        </Link>
      )}
    </div>
  );
}
