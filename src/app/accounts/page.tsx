import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { AccountsTable } from "@/components/AccountsTable";
import { buttonPrimary, card } from "@/lib/styles";
import { resolveSort } from "@/lib/sort";
import { requireBook } from "@/lib/session";
import { canWrite } from "@/lib/book-rules";

const SORT_FIELDS = ["name", "type"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.accounts.title };
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sort?: string; dir?: string }>;
}) {
  const { book, access } = await requireBook();
  const canEdit = canWrite(access);
  const { error, ...sp } = await searchParams;
  const { t } = await getTranslations();
  const { field, dir } = resolveSort(sp, SORT_FIELDS, "name");

  const accounts = await prisma.account.findMany({
    where: { bookId: book.id },
    orderBy: { [field]: dir },
  });

  const accountRows = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    cutoffDay: account.cutoffDay,
    paymentDay: account.paymentDay,
    confirmMessage: t.accounts.confirmDelete(account.name),
  }));

  const accountsCopy = {
    caption: t.accounts.title,
    actionsLabel: t.common.actions,
    tableName: t.accounts.tableName,
    tableType: t.accounts.tableType,
    tableCutoffDay: t.accounts.tableCutoffDay,
    tablePaymentDay: t.accounts.tablePaymentDay,
    editLabel: t.common.edit,
    deleteLabel: t.common.delete,
    deletingLabel: t.common.deleting,
    cancelLabel: t.common.cancel,
  };

  return (
    <PageContainer
      title={<PageTitle>{t.accounts.title}</PageTitle>}
      actions={canEdit && (
        <Link href="/accounts/new" className={buttonPrimary}>
          {t.accounts.newButton}
        </Link>
      )}
    >
      {error === "hasExpenses" && (
        <p className="rounded-lg border border-danger-soft bg-danger-soft px-4 py-2 text-sm text-danger">
          {t.accounts.errors.hasExpenses}
        </p>
      )}

      {accounts.length === 0 ? (
        <p className="text-sm text-ink-muted">{t.accounts.emptyMessage}</p>
      ) : (
        <div className={card}>
          <AccountsTable canEdit={canEdit} accounts={accountRows} copy={accountsCopy} sort={field} dir={dir} />
        </div>
      )}
    </PageContainer>
  );
}
