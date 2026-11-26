import type { ReactNode } from "react";
import Image from "next/image";
import logo from "@/assets/logo.png";

export function AuthCard({
  title,
  subtitle,
  children,
  appName,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  appName: string;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Image src={logo} alt="" width={48} height={48} className="rounded-xl" />
          <span className="font-semibold text-brand-navy">{appName}</span>
        </div>
        <div className="rounded-3xl bg-surface p-6 shadow-[0_24px_80px_-24px_rgb(1_38_53_/_0.22)] sm:p-10">
          <h1 className="mb-3 text-center text-2xl font-bold tracking-tight text-brand-navy">{title}</h1>
          {subtitle && <p className="mb-8 text-center text-sm leading-relaxed text-ink-muted">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
