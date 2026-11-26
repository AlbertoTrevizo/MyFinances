"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "./icons";
import { Modal } from "./Modal";
import { buttonSecondary, iconButtonDanger } from "@/lib/styles";

export function DeleteButton({
  action,
  confirmMessage,
  label,
  pendingLabel,
  cancelLabel,
  describedBy,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
  pendingLabel: string;
  cancelLabel: string;
  describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        aria-label={isPending ? pendingLabel : label}
        aria-describedby={describedBy}
        title={isPending ? pendingLabel : label}
        onClick={() => setOpen(true)}
        className={iconButtonDanger}
      >
        <TrashIcon className="h-4 w-4" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={label}>
        <p className="text-sm text-ink-muted">{confirmMessage}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" autoFocus className={`${buttonSecondary} w-auto! flex-1`} onClick={() => setOpen(false)}>
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50"
            onClick={() => {
              startTransition(async () => {
                await action();
                setOpen(false);
              });
            }}
          >
            {isPending ? pendingLabel : label}
          </button>
        </div>
      </Modal>
    </>
  );
}
