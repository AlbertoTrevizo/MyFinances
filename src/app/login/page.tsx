import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";
import { LoginForm } from "./LoginForm";
import { card } from "@/lib/styles";

const KNOWN_ERRORS = ["google_failed", "google_not_configured"] as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { t } = await getTranslations();
  const sp = await searchParams;
  const errorKey = KNOWN_ERRORS.find((key) => key === sp.error);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-canvas px-4 py-10">
      <div className={`w-full max-w-sm p-6 sm:p-8 ${card}`}>
        <h1 className="mb-1 text-xl font-semibold text-ink">{t.auth.title}</h1>
        <p className="mb-6 text-sm text-ink-muted">{t.auth.subtitle}</p>

        {errorKey && (
          <p className="mb-4 rounded-lg border border-danger-soft bg-danger-soft px-3 py-2 text-sm text-danger">
            {t.auth.errors[errorKey]}
          </p>
        )}

        <LoginForm t={t.auth} />
      </div>
    </div>
  );
}
