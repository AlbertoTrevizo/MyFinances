import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/currency";
import { getTranslations } from "@/i18n/get-locale";

export default async function Home() {
  const { locale, t } = await getTranslations();

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [accountCount, categoryCount, expenseCount, monthTotal] = await Promise.all([
    prisma.account.count(),
    prisma.category.count(),
    prisma.expense.count(),
    prisma.expense.aggregate({
      _sum: { amountCents: true },
      where: { date: { gte: monthStart, lt: monthEnd } },
    }),
  ]);

  const cards = [
    {
      href: "/expenses",
      label: t.home.expensesCard.label,
      description: t.home.expensesCard.description,
      stat: t.home.expensesCard.stat(expenseCount),
    },
    {
      href: "/accounts",
      label: t.home.accountsCard.label,
      description: t.home.accountsCard.description,
      stat: t.home.accountsCard.stat(accountCount),
    },
    {
      href: "/categories",
      label: t.home.categoriesCard.label,
      description: t.home.categoriesCard.description,
      stat: t.home.categoriesCard.stat(categoryCount),
    },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {t.home.greeting}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t.home.spentThisMonth}{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {formatCents(monthTotal._sum.amountCents ?? 0, locale)}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {card.label}
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {card.description}
            </span>
            <span className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-500">
              {card.stat}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
