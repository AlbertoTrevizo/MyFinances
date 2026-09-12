import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/DeleteButton";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { buttonPrimary, linkMuted, card } from "@/lib/styles";
import { deleteCategory } from "./actions";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await getTranslations();
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <PageContainer
      title={<PageTitle>{t.categories.title}</PageTitle>}
      actions={
        <Link href="/categories/new" className={buttonPrimary}>
          {t.categories.newButton}
        </Link>
      }
    >
      {error && (
        <p className="rounded-lg border border-danger-soft bg-danger-soft px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-ink-muted">{t.categories.emptyMessage}</p>
      ) : (
        <div className={card}>
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="bg-canvas text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.categories.tableName}</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-t border-line transition-colors hover:bg-canvas"
                  >
                    <td className="px-4 py-3 text-ink">{category.name}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-4">
                        <Link href={`/categories/${category.id}/edit`} className={linkMuted}>
                          {t.common.edit}
                        </Link>
                        <DeleteButton
                          action={deleteCategory.bind(null, category.id)}
                          confirmMessage={t.categories.confirmDelete(category.name)}
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
