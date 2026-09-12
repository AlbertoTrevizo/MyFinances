import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/DeleteButton";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { SortableHeader } from "@/components/SortableHeader";
import { PencilIcon } from "@/components/icons";
import { buttonPrimary, iconButton, card } from "@/lib/styles";
import { resolveSort } from "@/lib/sort";
import { deleteCategory } from "./actions";

const SORT_FIELDS = ["name"] as const;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sort?: string; dir?: string }>;
}) {
  const { error, ...sp } = await searchParams;
  const { t } = await getTranslations();
  const { field, dir } = resolveSort(sp, SORT_FIELDS, "name");

  const categories = await prisma.category.findMany({
    orderBy: { [field]: dir },
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
                  <th className="px-4 py-3 font-medium">
                    <SortableHeader
                      label={t.categories.tableName}
                      field="name"
                      activeField={field}
                      dir={dir}
                      basePath="/categories"
                    />
                  </th>
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
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/categories/${category.id}/edit`}
                          aria-label={t.common.edit}
                          title={t.common.edit}
                          className={iconButton}
                        >
                          <PencilIcon className="h-4 w-4" />
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
