import { CategoryForm } from "../CategoryForm";
import { createCategory } from "../actions";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";

export default async function NewCategoryPage() {
  const { t } = await getTranslations();

  return (
    <PageContainer title={<PageTitle>{t.categories.newTitle}</PageTitle>}>
      <CategoryForm
        action={createCategory}
        submitLabel={t.categories.createSubmit}
        form={t.categories.form}
        saving={t.common.saving}
      />
    </PageContainer>
  );
}
