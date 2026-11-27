import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "../../AccountForm";
import { updateAccount } from "../../actions";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { requireBookWriter } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.accounts.editTitle };
}

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { book } = await requireBookWriter();
  const { id } = await params;
  const { t } = await getTranslations();
  const account = await prisma.account.findUnique({ where: { id_bookId: { id, bookId: book.id } } });
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
