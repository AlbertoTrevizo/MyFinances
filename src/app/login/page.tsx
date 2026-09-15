import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";
import { LoginForm } from "./LoginForm";
import { GoogleIcon } from "@/components/icons";
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

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs text-ink-faint">{t.auth.orDivider}</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <a
          href="/api/auth/google"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas"
        >
          <GoogleIcon className="h-4 w-4" />
          {t.auth.googleButton}
        </a>
      </div>
    </div>
  );
}
