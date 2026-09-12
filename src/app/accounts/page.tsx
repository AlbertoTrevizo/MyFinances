import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/DeleteButton";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { SortableHeader } from "@/components/SortableHeader";
import { PencilIcon } from "@/components/icons";
import { buttonPrimary, iconButton, card } from "@/lib/styles";
import { resolveSort } from "@/lib/sort";
import { deleteAccount } from "./actions";

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
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-canvas text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    <SortableHeader
                      label={t.accounts.tableName}
                      field="name"
                      activeField={field}
                      dir={dir}
                      basePath="/accounts"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <SortableHeader
                      label={t.accounts.tableType}
                      field="type"
                      activeField={field}
                      dir={dir}
                      basePath="/accounts"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">{t.accounts.tableCutoffDay}</th>
                  <th className="px-4 py-3 font-medium">{t.accounts.tablePaymentDay}</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-t border-line transition-colors hover:bg-canvas"
                  >
                    <td className="px-4 py-3 text-ink">{account.name}</td>
                    <td className="px-4 py-3 text-ink-muted">{account.type}</td>
                    <td className="px-4 py-3 font-mono text-ink-muted">
                      {account.cutoffDay ?? <span className="text-ink-faint">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-muted">
                      {account.paymentDay ?? <span className="text-ink-faint">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/accounts/${account.id}/edit`}
                          aria-label={t.common.edit}
                          title={t.common.edit}
                          className={iconButton}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <DeleteButton
                          action={deleteAccount.bind(null, account.id)}
                          confirmMessage={t.accounts.confirmDelete(account.name)}
                          label={t.common.delete}
                          pendingLabel={t.common.deleting}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
