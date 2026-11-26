"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { buttonSecondary, card } from "@/lib/styles";

export function Modal({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: "any" } as object)}
      onClose={onClose}
      className={`m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto p-6 text-left text-ink backdrop:bg-black/40 ${card}`}
      onClick={(event) => {
        const dialog = event.currentTarget;
        if ("closedBy" in HTMLDialogElement.prototype || event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom
        ) dialog.close();
      }}
    >
      <h1 id={titleId} className="mb-4 text-lg font-semibold text-ink">{title}</h1>
      {open && (
        <>
          {children}
          {closeLabel && (
            <button type="button" className={`${buttonSecondary} mt-4`} onClick={() => dialogRef.current?.close()}>
              {closeLabel}
            </button>
          )}
        </>
      )}
    </dialog>
  );
}
