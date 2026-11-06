import { getTranslations } from "@/i18n/get-locale";
import { findToken } from "@/lib/user-tokens";
import { AuthCard } from "@/components/AuthCard";
import { ConfirmForm } from "./ConfirmForm";
import { ResendForm } from "./ResendForm";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const { t } = await getTranslations();
  // Read only: the link is spent by the button, not by opening the page.
  const row = token ? await findToken(token, ["confirm", "email_change"]) : null;

  if (!token || !row) {
    return (
      <AuthCard title={t.confirmEmail.invalidTitle} subtitle={t.confirmEmail.invalidBody}>
        <ResendForm t={t.resend} />
      </AuthCard>
    );
  }

  const change = row.purpose === "email_change";
  return (
    <AuthCard
      title={change ? t.confirmEmail.changeTitle : t.confirmEmail.confirmTitle}
      subtitle={change ? t.confirmEmail.changeBody : t.confirmEmail.confirmBody}
    >
      <ConfirmForm token={token} t={t.confirmEmail} />
    </AuthCard>
  );
}
