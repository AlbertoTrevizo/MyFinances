"use client";

import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          disabled={isPending || locale === code}
          onClick={() => startTransition(() => setLocale(code))}
          className={`rounded px-2 py-1 uppercase transition-colors disabled:cursor-default ${
            locale === code
              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
