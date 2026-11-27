import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { getTranslations } from "@/i18n/get-locale";
import { getCurrentUser, resolveBook } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

const brandSans = Plus_Jakarta_Sans({
  variable: "--font-sans-brand",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: { template: `%s | ${t.appName}`, default: t.appName },
    description: t.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, t } = await getTranslations();
  const current = await getCurrentUser();
  // No sidebar for a stale session or while the profile is incomplete.
  const user = current?.emailVerifiedAt && !current.profileIncomplete ? current : null;
  const bookContext = user ? await resolveBook(user) : null;

  return (
    <html
      lang={locale}
      className={`${brandSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-ink md:flex-row">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-primary">
          {t.common.skipToContent}
        </a>
        {user && bookContext && (
          <Sidebar
            appName={t.appName}
            nav={t.nav}
            locale={locale}
            languageLabel={t.common.language}
            languageLabels={t.common.languages}
            userEmail={user.email}
            isAdmin={isAdmin(user)}
            logoutLabel={t.auth.logout}
            activeBook={bookContext.book}
            books={bookContext.books}
            activeBookLabel={t.books.activeBook}
          />
        )}
        <main
          id="main"
          tabIndex={-1}
          className={
            user ? "min-w-0 flex-1 md:h-screen md:overflow-y-auto" : "min-w-0 flex-1"
          }
        >
          {children}
        </main>
      </body>
    </html>
  );
}
