import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "../../CategoryForm";
import { updateCategory } from "../../actions";
import { getTranslations } from "@/i18n/get-locale";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getTranslations();
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t.categories.editTitle}
      </h1>
      <CategoryForm
        action={updateCategory.bind(null, id)}
        defaultValues={{ name: category.name }}
        submitLabel={t.categories.editSubmit}
        t={t}
      />
    </div>
  );
}
