import { AccountForm } from "../AccountForm";
import { createAccount } from "../actions";
import { getTranslations } from "@/i18n/get-locale";

export default async function NewAccountPage() {
  const { t } = await getTranslations();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t.accounts.newTitle}
      </h1>
      <AccountForm action={createAccount} submitLabel={t.accounts.createSubmit} t={t} />
    </div>
  );
}
