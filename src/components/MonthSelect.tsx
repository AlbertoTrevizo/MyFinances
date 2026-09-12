"use client";

import { useRouter } from "next/navigation";
import { inputField } from "@/lib/styles";

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

  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => router.push(`/?month=${e.target.value}`)}
      className={`${inputField} capitalize`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="capitalize">
          {option.label}
        </option>
      ))}
    </select>
  );
}
