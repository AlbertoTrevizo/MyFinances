import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";
import { LoginForm } from "./LoginForm";
import { AuthSwitcher } from "@/components/auth/AuthSwitcher";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { RegisterForm } from "@/app/register/RegisterForm";

const NOTICES = ["emailConfirmed", "emailChanged", "passwordReset"] as const;
const ERRORS = {
  google_not_authoritative: "googleNotAuthoritative",
  google_unverified: "googleUnverified",
  google_failed: "googleFailed",
  google_not_configured: "googleNotConfigured",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.auth.title };
}

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
    <AuthSwitcher
      appName={t.appName}
      googleButton={<GoogleSignIn label={t.auth.googleButton} divider={t.auth.emailDivider} />}
      login={{
        heading: t.auth.signInButton,
        title: t.auth.title,
        heroTitle: t.auth.newHereTitle,
        heroText: t.auth.newHereText,
        switchLabel: t.register.submit,
        content: <>
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
        </>,
      }}
      register={{
        heading: t.register.submit,
        title: t.register.title,
        heroTitle: t.auth.welcomeBackTitle,
        heroText: t.auth.welcomeBackText,
        switchLabel: t.auth.signInButton,
        content: <RegisterForm t={t.register} auth={t.auth} resend={t.resend} />,
      }}
    />
  );
}
