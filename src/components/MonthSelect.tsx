"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { selectField } from "@/lib/styles";

export function MonthSelect({
  value,
  options,
  label,
}: {
  value: string;
  options: { value: string; label: string }[];
  label: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      aria-label={label}
      aria-busy={isPending}
      data-pending={isPending ? "" : undefined}
      value={value}
      onChange={(e) => {
        const month = e.target.value;
        startTransition(() => router.push(`/?month=${month}`));
      }}
      className={`${selectField} month-select w-full min-w-0 sm:w-auto sm:min-w-52`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
