import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/currency";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { ExpensesIcon, AccountsIcon, CategoriesIcon } from "@/components/icons";
import { card } from "@/lib/styles";

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
      icon: ExpensesIcon,
    },
    {
      href: "/accounts",
      label: t.home.accountsCard.label,
      description: t.home.accountsCard.description,
      stat: t.home.accountsCard.stat(accountCount),
      icon: AccountsIcon,
    },
    {
      href: "/categories",
      label: t.home.categoriesCard.label,
      description: t.home.categoriesCard.description,
      stat: t.home.categoriesCard.stat(categoryCount),
      icon: CategoriesIcon,
    },
  ];

  return (
    <PageContainer title={<PageTitle>{t.home.greeting}</PageTitle>}>
      <div className={`${card} p-5 sm:p-6`}>
        <p className="text-sm text-ink-muted">{t.home.spentThisMonth}</p>
        <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-ink sm:text-4xl">
          {formatCents(monthTotal._sum.amountCents ?? 0, locale)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex flex-col gap-3 ${card} p-5 transition-colors hover:border-primary/40`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <item.icon className="h-[18px] w-[18px]" />
            </span>
            <span className="font-semibold text-ink">{item.label}</span>
            <span className="text-sm text-ink-muted">{item.description}</span>
            <span className="mt-1 font-mono text-sm font-medium text-ink-muted transition-colors group-hover:text-primary">
              {item.stat}
            </span>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
