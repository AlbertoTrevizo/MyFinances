"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { HomeIcon, ExpensesIcon, AccountsIcon, CategoriesIcon, BudgetIcon, UsersIcon, LogoutIcon } from "./icons";
import logo from "@/assets/logo.png";
import { logout } from "@/app/login/actions";
import { iconButton } from "@/lib/styles";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export function Sidebar({
  appName,
  nav,
  locale,
  languageLabel,
  languageLabels,
  userEmail,
  logoutLabel,
  isAdmin,
}: {
  appName: string;
  nav: Dictionary["nav"];
  locale: Locale;
  languageLabel: string;
  languageLabels: Record<Locale, string>;
  userEmail: string;
  logoutLabel: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: nav.home, icon: HomeIcon },
    { href: "/expenses", label: nav.expenses, icon: ExpensesIcon },
    { href: "/accounts", label: nav.accounts, icon: AccountsIcon },
    { href: "/categories", label: nav.categories, icon: CategoriesIcon },
    { href: "/budget", label: nav.budget, icon: BudgetIcon },
    ...(isAdmin ? [{ href: "/users", label: nav.users, icon: UsersIcon }] : []),
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-6">
        <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <Image
            src={logo}
            width={36}
            height={36}
            sizes="(min-width: 768px) 36px, 32px"
            alt=""
            className="h-8 w-8 shrink-0 rounded-lg md:h-9 md:w-9"
          />
          <span className="text-base font-semibold text-ink md:text-lg">
            {appName}
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <LanguageSwitcher locale={locale} label={languageLabel} labels={languageLabels} />
          <form action={logout}>
            <button type="submit" aria-label={logoutLabel} className={`${iconButton} h-9 w-9`}>
              <LogoutIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      <nav aria-label={nav.label} className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:gap-1 md:overflow-visible md:px-3 md:pb-0">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-full px-3.5 py-2.5 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:rounded-xl ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-ink-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden md:block md:px-3 md:py-4">
        <LanguageSwitcher locale={locale} label={languageLabel} labels={languageLabels} />
      </div>

      <div className="hidden border-t border-line px-3 py-3 md:block md:px-3 md:py-4">
        <p className="truncate px-3.5 text-xs text-ink-muted" title={userEmail}>
          {userEmail}
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="mt-2 flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-[15px] font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:rounded-xl"
          >
            <LogoutIcon className="h-5 w-5 shrink-0" />
            {logoutLabel}
          </button>
        </form>
      </div>
    </header>
  );
}
