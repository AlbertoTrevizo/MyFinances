"use client";

import { useTransition } from "react";

export function DeleteButton({
  action,
  confirmMessage,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          startTransition(() => {
            action();
          });
        }
      }}
      className="text-sm font-medium text-red-600 transition-colors hover:text-red-800 disabled:opacity-50 dark:text-red-500 dark:hover:text-red-400"
    >
      {isPending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
