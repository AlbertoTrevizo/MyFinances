import type { ReactNode } from "react";
import { card } from "@/lib/styles";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-canvas px-4 py-10">
      <div className={`w-full max-w-sm p-6 sm:p-8 ${card}`}>
        <h1 className="mb-1 text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mb-6 text-sm text-ink-muted">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
