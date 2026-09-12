"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { HomeIcon, ExpensesIcon, AccountsIcon, CategoriesIcon, BudgetIcon } from "./icons";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export function Sidebar({
  appName,
  nav,
  locale,
}: {
  appName: string;
  nav: Dictionary["nav"];
  locale: Locale;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: nav.home, icon: HomeIcon },
    { href: "/expenses", label: nav.expenses, icon: ExpensesIcon },
    { href: "/accounts", label: nav.accounts, icon: AccountsIcon },
    { href: "/categories", label: nav.categories, icon: CategoriesIcon },
    { href: "/budget", label: nav.budget, icon: BudgetIcon },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white">
            {appName.charAt(0)}
          </span>
          <span className="text-sm font-semibold text-ink md:text-base">
            {appName}
          </span>
        </Link>
        <div className="md:hidden">
          <LanguageSwitcher locale={locale} />
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:gap-1 md:overflow-visible md:px-3 md:pb-0">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-soft text-primary"
                  : "text-ink-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden md:block md:px-3 md:py-4">
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
