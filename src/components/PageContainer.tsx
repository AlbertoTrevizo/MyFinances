import type { ReactNode } from "react";

export function PageContainer({
  title,
  actions,
  children,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>{title}</div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
      {children}
    </h1>
  );
}
