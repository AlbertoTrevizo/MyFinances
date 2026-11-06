import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";
import { LoginForm } from "./LoginForm";
import { AuthCard } from "@/components/AuthCard";
import { GoogleSignIn } from "@/components/GoogleSignIn";

const NOTICES = ["emailConfirmed", "emailChanged", "passwordReset"] as const;
const ERRORS = {
  google_unverified: "googleUnverified",
  google_failed: "googleFailed",
  google_not_configured: "googleNotConfigured",
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  // An unconfirmed or stale session must not bounce between /login and /.
  const user = await getCurrentUser();
  if (user?.emailVerifiedAt) redirect("/");

  const { t } = await getTranslations();
  const params = await searchParams;
  const notice = NOTICES.find((key) => key === params.notice);
  const errorKey = ERRORS[params.error as keyof typeof ERRORS];

  return (
    <AuthCard title={t.auth.title} subtitle={t.auth.subtitle}>
      {notice && (
        <p role="status" className="mb-4 text-sm text-ink-muted">
          {t.auth.notices[notice]}
        </p>
      )}
      {errorKey && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {t.auth.errors[errorKey]}
        </p>
      )}

      <LoginForm t={t.auth} resend={t.resend} />
      <GoogleSignIn label={t.auth.googleButton} divider={t.auth.orDivider} />

      <p className="mt-6 text-sm">
        <Link href="/register" className="text-primary hover:text-primary-strong">
          {t.auth.registerLink}
        </Link>
      </p>
    </AuthCard>
  );
}
