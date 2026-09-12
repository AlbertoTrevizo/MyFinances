import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "../../AccountForm";
import { updateAccount } from "../../actions";
import { getTranslations } from "@/i18n/get-locale";

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
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t.accounts.editTitle}
      </h1>
      <AccountForm
        action={updateAccount.bind(null, id)}
        defaultValues={{ name: account.name, type: account.type }}
        submitLabel={t.accounts.editSubmit}
        t={t}
      />
    </div>
  );
}
