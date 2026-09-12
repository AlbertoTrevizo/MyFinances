import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "../../AccountForm";
import { updateAccount } from "../../actions";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getTranslations();
  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) notFound();

  return (
    <PageContainer title={<PageTitle>{t.accounts.editTitle}</PageTitle>}>
      <AccountForm
        action={updateAccount.bind(null, id)}
        defaultValues={{
          name: account.name,
          type: account.type,
          cutoffDay: account.cutoffDay?.toString() ?? "",
          paymentDay: account.paymentDay?.toString() ?? "",
        }}
        submitLabel={t.accounts.editSubmit}
        form={t.accounts.form}
        saving={t.common.saving}
      />
    </PageContainer>
  );
}
