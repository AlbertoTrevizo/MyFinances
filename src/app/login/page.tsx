import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";
import { LoginForm } from "./LoginForm";
import { card } from "@/lib/styles";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user?.isAdmin) redirect("/");

  const { t } = await getTranslations();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-canvas px-4 py-10">
      <div className={`w-full max-w-sm p-6 sm:p-8 ${card}`}>
        <h1 className="mb-1 text-xl font-semibold text-ink">{t.auth.title}</h1>
        <p className="mb-6 text-sm text-ink-muted">{t.auth.subtitle}</p>

        <LoginForm t={t.auth} />
      </div>
    </div>
  );
}
