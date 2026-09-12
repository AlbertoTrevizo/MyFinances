import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "../../CategoryForm";
import { updateCategory } from "../../actions";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";

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
    <PageContainer title={<PageTitle>{t.categories.editTitle}</PageTitle>}>
      <CategoryForm
        action={updateCategory.bind(null, id)}
        defaultValues={{ name: category.name }}
        submitLabel={t.categories.editSubmit}
        form={t.categories.form}
        saving={t.common.saving}
      />
    </PageContainer>
  );
}
