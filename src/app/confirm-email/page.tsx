import type { Metadata } from "next";
import { getTranslations } from "@/i18n/get-locale";
import { findToken } from "@/lib/user-tokens";
import { AuthCard } from "@/components/AuthCard";
import { ConfirmForm } from "./ConfirmForm";
import { ResendForm } from "./ResendForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.confirmEmail.confirmTitle };
}

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
      <AuthCard appName={t.appName} title={t.confirmEmail.invalidTitle} subtitle={t.confirmEmail.invalidBody}>
        <ResendForm t={t.resend} />
      </AuthCard>
    );
  }

  const change = row.purpose === "email_change";
  const requiresPassword = !change && row.user.passwordReplaced;
  return (
    <AuthCard
      appName={t.appName}
      title={change ? t.confirmEmail.changeTitle : t.confirmEmail.confirmTitle}
      subtitle={change ? t.confirmEmail.changeBody : requiresPassword ? t.confirmEmail.passwordBody : t.confirmEmail.confirmBody}
    >
      <ConfirmForm token={token} requiresPassword={requiresPassword} t={t.confirmEmail} passwordLabels={t.resetPassword} passwordHint={t.register.passwordHint} />
    </AuthCard>
  );
}
