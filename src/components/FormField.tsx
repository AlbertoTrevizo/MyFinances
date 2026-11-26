"use client";

import { useId } from "react";
import { inputField, inputFilled } from "@/lib/styles";

export function FormField({
  label,
  name,
  type = "text",
  defaultValue,
  error,
  hint,
  autoComplete,
  required = true,
  variant = "default",
}: {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  defaultValue?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
  variant?: "default" | "filled";
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        spellCheck={type === "email" ? false : undefined}
        autoCapitalize={type === "email" ? "none" : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={variant === "filled" ? inputFilled : inputField}
      />
      {hint && (
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      )}
      <div aria-live="polite" className={error ? undefined : "sr-only"}>
        {error && (
          <p id={errorId} className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
