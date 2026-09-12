import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { AccountsTable } from "@/components/AccountsTable";
import { buttonPrimary, card } from "@/lib/styles";
import { resolveSort } from "@/lib/sort";

const SORT_FIELDS = ["name", "type"] as const;

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sort?: string; dir?: string }>;
}) {
  const { error, ...sp } = await searchParams;
  const { t } = await getTranslations();
  const { field, dir } = resolveSort(sp, SORT_FIELDS, "name");

  const accounts = await prisma.account.findMany({
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
    tableName: t.accounts.tableName,
    tableType: t.accounts.tableType,
    tableCutoffDay: t.accounts.tableCutoffDay,
    tablePaymentDay: t.accounts.tablePaymentDay,
    editLabel: t.common.edit,
    deleteLabel: t.common.delete,
    deletingLabel: t.common.deleting,
  };

  return (
    <PageContainer
      title={<PageTitle>{t.accounts.title}</PageTitle>}
      actions={
        <Link href="/accounts/new" className={buttonPrimary}>
          {t.accounts.newButton}
        </Link>
      }
    >
      {error && (
        <p className="rounded-lg border border-danger-soft bg-danger-soft px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {accounts.length === 0 ? (
        <p className="text-sm text-ink-muted">{t.accounts.emptyMessage}</p>
      ) : (
        <div className={card}>
          <AccountsTable accounts={accountRows} copy={accountsCopy} sort={field} dir={dir} />
        </div>
      )}
    </PageContainer>
  );
}
