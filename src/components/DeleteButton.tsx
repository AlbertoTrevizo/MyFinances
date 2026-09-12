"use client";

import { useTransition } from "react";

export function DeleteButton({
  action,
  confirmMessage,
  label,
  pendingLabel,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
  pendingLabel: string;
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
      className="text-sm font-medium text-danger transition-colors hover:text-danger-strong disabled:opacity-50"
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}
