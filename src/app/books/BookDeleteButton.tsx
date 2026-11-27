"use client";

import { useState } from "react";
import { DeleteButton } from "@/components/DeleteButton";
import type { ActionState } from "./actions";

export function BookDeleteButton({ action, confirmMessage, label, pendingLabel, cancelLabel, describedBy }: {
  action: () => Promise<ActionState>;
  confirmMessage: string;
  label: string;
  pendingLabel: string;
  cancelLabel: string;
  describedBy?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <DeleteButton
        action={async () => {
          setError(null);
          const result = await action();
          if (result?.error) setError(result.error);
        }}
        confirmMessage={confirmMessage}
        label={label}
        pendingLabel={pendingLabel}
        cancelLabel={cancelLabel}
        describedBy={describedBy}
      />
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
