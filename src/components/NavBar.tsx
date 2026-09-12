import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export function NavBar({ t, locale }: { t: Dictionary; locale: Locale }) {
  const links = [
    { href: "/expenses", label: t.nav.expenses },
    { href: "/accounts", label: t.nav.accounts },
    { href: "/categories", label: t.nav.categories },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <nav className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4">
        <Link href="/" className="font-semibold text-zinc-900 dark:text-zinc-50">
          {t.appName}
        </Link>
        <div className="flex gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto">
          <LanguageSwitcher locale={locale} />
        </div>
      </nav>
    </header>
  );
}
