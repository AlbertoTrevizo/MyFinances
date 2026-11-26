"use client";

import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ locale, label, labels }: {
  locale: Locale;
  label: string;
  labels: Record<Locale, string>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div role="group" aria-label={label} className="flex items-center gap-1 rounded-lg border border-line bg-canvas p-1 text-xs font-medium">
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={locale === code}
          aria-disabled={isPending || locale === code}
          lang={code}
          onClick={() => {
            if (isPending || locale === code) return;
            startTransition(async () => { await setLocale(code); });
          }}
          className={`rounded-md px-2 py-1 uppercase transition-colors aria-disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            locale === code
              ? "bg-surface text-ink shadow-card"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          {labels[code]}
        </button>
      ))}
    </div>
  );
}
