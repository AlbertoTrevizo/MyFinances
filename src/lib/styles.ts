export const buttonPrimary =
  "inline-flex w-fit items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50";

export const inputField =
  "rounded-lg border border-line bg-surface px-3 py-2 text-base sm:text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-primary";

export const selectField = `${inputField} select-picker whitespace-nowrap`;

export const inputFilled =
  "min-w-0 rounded-xl border border-transparent bg-field px-4 py-3 text-base sm:text-sm text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-offset-0 focus:outline-primary";

export const authButtonPrimary = `${buttonPrimary} auth-submit self-center motion-reduce:transition-none`;

export const card =
  "rounded-2xl border border-line bg-surface shadow-card";

export const iconButton =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const iconButtonDanger =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger-soft hover:text-danger-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50";

export const buttonSecondary =
  "inline-flex w-full items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const badge =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

export const expenseTypeBadge = {
  needs: "bg-primary-soft text-primary-strong",
  wants: "bg-amber-50 text-amber-800",
  savings: "bg-violet-50 text-violet-800",
};
