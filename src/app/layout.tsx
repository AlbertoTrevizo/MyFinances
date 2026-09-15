import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { getTranslations } from "@/i18n/get-locale";
import { getCurrentUser } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: t.appName,
    description: t.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, t } = await getTranslations();
  const user = await getCurrentUser();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-ink md:flex-row">
        {user && (
          <Sidebar
            appName={t.appName}
            nav={t.nav}
            locale={locale}
            userEmail={user.email}
            logoutLabel={t.auth.logout}
          />
        )}
        <main
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
