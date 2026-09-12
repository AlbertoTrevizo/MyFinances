import { AccountForm } from "../AccountForm";
import { createAccount } from "../actions";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";

export default async function NewAccountPage() {
  const { t } = await getTranslations();

  return (
    <PageContainer title={<PageTitle>{t.accounts.newTitle}</PageTitle>}>
      <AccountForm
        action={createAccount}
        submitLabel={t.accounts.createSubmit}
        form={t.accounts.form}
        saving={t.common.saving}
      />
    </PageContainer>
  );
}
