import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";
import { RegisterForm } from "./RegisterForm";
import { AuthCard } from "@/components/AuthCard";
import { GoogleSignIn } from "@/components/GoogleSignIn";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user?.emailVerifiedAt) redirect("/");

  const { t } = await getTranslations();

  return (
    <AuthCard title={t.register.title} subtitle={t.register.subtitle}>
      <RegisterForm t={t.register} auth={t.auth} resend={t.resend} />
      <GoogleSignIn label={t.auth.googleButton} divider={t.auth.orDivider} />
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-primary hover:text-primary-strong">
          {t.auth.signInLink}
        </Link>
      </p>
    </AuthCard>
  );
}
