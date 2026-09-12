"use client";

import { useEffect, type ReactNode } from "react";
import { card } from "@/lib/styles";

export function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[90vh] w-full max-w-md overflow-y-auto p-6 ${card}`}
      >
        {title}
        {children}
      </div>
    </div>
  );
}
