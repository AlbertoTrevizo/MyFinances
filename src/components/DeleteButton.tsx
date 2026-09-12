"use client";

import { useTransition } from "react";
import { TrashIcon } from "./icons";
import { iconButtonDanger } from "@/lib/styles";

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
      aria-label={isPending ? pendingLabel : label}
      title={isPending ? pendingLabel : label}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          startTransition(() => {
            action();
          });
        }
      }}
      className={iconButtonDanger}
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
