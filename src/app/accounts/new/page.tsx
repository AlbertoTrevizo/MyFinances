import type { Metadata } from "next";
import { AccountForm } from "../AccountForm";
import { createAccount } from "../actions";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { requireBookWriter } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.accounts.newTitle };
}

export default async function NewAccountPage() {
  await requireBookWriter();
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
