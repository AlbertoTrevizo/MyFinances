import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/DeleteButton";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { buttonPrimary, linkMuted, card } from "@/lib/styles";
import { deleteAccount } from "./actions";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await getTranslations();
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "asc" },
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
                  <th className="px-4 py-3 font-medium">{t.accounts.tableName}</th>
                  <th className="px-4 py-3 font-medium">{t.accounts.tableType}</th>
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
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-4">
                        <Link href={`/accounts/${account.id}/edit`} className={linkMuted}>
                          {t.common.edit}
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
