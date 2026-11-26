import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "@/i18n/get-locale";
import { AuthCard } from "@/components/AuthCard";
import { ForgotForm } from "./ForgotForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.forgotPassword.title };
}

export default async function ForgotPasswordPage() {
  const { t } = await getTranslations();
  return (
    <AuthCard appName={t.appName} title={t.forgotPassword.title} subtitle={t.forgotPassword.subtitle}>
      <ForgotForm t={t.forgotPassword} emailLabel={t.auth.emailLabel} />
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-primary hover:text-primary-strong">
          {t.auth.signInLink}
        </Link>
      </p>
    </AuthCard>
  );
}
