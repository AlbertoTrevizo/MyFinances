import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";
import { RegisterForm } from "./RegisterForm";
import { AuthSwitcher } from "@/components/auth/AuthSwitcher";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { LoginForm } from "@/app/login/LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.register.title };
}

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user?.emailVerifiedAt) redirect("/");

  const { t } = await getTranslations();

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
        content: <LoginForm t={t.auth} resend={t.resend} />,
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
