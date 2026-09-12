"use client";

import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-line bg-canvas p-1 text-xs font-medium">
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          disabled={isPending || locale === code}
          onClick={() => startTransition(() => setLocale(code))}
          className={`rounded-md px-2 py-1 uppercase transition-colors disabled:cursor-default ${
            locale === code
              ? "bg-surface text-ink shadow-card"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
