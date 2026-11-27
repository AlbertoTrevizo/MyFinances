import type { Metadata } from "next";
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
import { requireBook } from "@/lib/session";
import { canWrite } from "@/lib/book-rules";

const SORT_FIELDS = ["name"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.categories.title };
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sort?: string; dir?: string }>;
}) {
  const { book, access } = await requireBook();
  const canEdit = canWrite(access);
  const { error, ...sp } = await searchParams;
  const { t } = await getTranslations();
  const { field, dir } = resolveSort(sp, SORT_FIELDS, "name");

  const categories = await prisma.category.findMany({
    where: { bookId: book.id },
    orderBy: { [field]: dir },
  });

  return (
    <PageContainer
      title={<PageTitle>{t.categories.title}</PageTitle>}
      actions={canEdit && (
        <Link href="/categories/new" className={buttonPrimary}>
          {t.categories.newButton}
        </Link>
      )}
    >
      {error === "hasExpenses" && (
        <p className="rounded-lg border border-danger-soft bg-danger-soft px-4 py-2 text-sm text-danger">
          {t.categories.errors.hasExpenses}
        </p>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-ink-muted">{t.categories.emptyMessage}</p>
      ) : (
        <div className={card}>
          <div role="region" tabIndex={0} aria-labelledby="categories-caption" className="relative max-w-full overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[320px] text-left text-sm">
              <caption id="categories-caption" className="sr-only">{t.categories.title}</caption>
              <thead className="border-b border-line bg-surface text-xs font-medium text-ink-muted">
                <tr>
                  <SortableHeader
                    label={t.categories.tableName}
                    field="name"
                    activeField={field}
                    dir={dir}
                    basePath="/categories"
                  />
                  <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">{t.common.actions}</span></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-line last:border-b-0 transition-colors hover:bg-canvas/60"
                  >
                    <td id={`category-${category.id}`} className="px-4 py-3.5 font-semibold text-ink">{category.name}</td>
                    <td className="px-4 py-3.5 text-right">
                      {canEdit && <div className="flex justify-end gap-1">
                        <Link
                          href={`/categories/${category.id}/edit`}
                          aria-label={t.common.edit}
                          aria-describedby={`category-${category.id}`}
                          title={t.common.edit}
                          className={iconButton}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <DeleteButton
                          describedBy={`category-${category.id}`}
                          action={deleteCategory.bind(null, category.id)}
                          confirmMessage={t.categories.confirmDelete(category.name)}
                          label={t.common.delete}
                          pendingLabel={t.common.deleting}
                          cancelLabel={t.common.cancel}
                        />
                      </div>}
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
