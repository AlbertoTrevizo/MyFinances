import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";
import { AuthCard } from "@/components/AuthCard";
import { ProfileForm } from "./ProfileForm";
import { logout } from "@/app/login/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.completeProfile.title };
}

export default async function CompleteProfilePage() {
  const user = await getCurrentUser();
  if (!user?.emailVerifiedAt) redirect("/login");
  if (!user.profileIncomplete) redirect("/");

  const { t } = await getTranslations();
  return (
    <AuthCard appName={t.appName} title={t.completeProfile.title} subtitle={t.completeProfile.subtitle}>
      <ProfileForm
        t={t.completeProfile}
        register={t.register}
        defaults={{ name: user.name ?? "", lastName: user.lastName ?? "" }}
      />
      <form action={logout} className="mt-6 text-center">
        <button type="submit" className="text-sm text-primary hover:text-primary-strong">
          {t.auth.logout}
        </button>
      </form>
    </AuthCard>
  );
}
