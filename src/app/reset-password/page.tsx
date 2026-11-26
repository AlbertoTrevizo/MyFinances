import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "@/i18n/get-locale";
import { findToken } from "@/lib/user-tokens";
import { AuthCard } from "@/components/AuthCard";
import { ResetForm } from "./ResetForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.resetPassword.title };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const { t } = await getTranslations();
  // Read only: the link is spent when the new password is saved.
  const row = token ? await findToken(token, ["reset"]) : null;

  if (!token || !row) {
    return (
      <AuthCard appName={t.appName} title={t.resetPassword.invalidTitle} subtitle={t.resetPassword.invalidBody}>
        <Link href="/forgot-password" className="block text-center text-sm text-primary hover:text-primary-strong">
          {t.resetPassword.requestNew}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard appName={t.appName} title={t.resetPassword.title} subtitle={t.resetPassword.subtitle}>
      <ResetForm token={token} t={t.resetPassword} passwordHint={t.register.passwordHint} />
    </AuthCard>
  );
}
