import { buttonSecondary } from "@/lib/styles";

// A plain link on purpose: CSP form-action 'self' would block a form that redirects to Google, and next/link may prefetch.
export function GoogleSignIn({ label, divider }: { label: string; divider: string }) {
  return (
    <>
      <div className="my-4 flex items-center gap-3 text-xs text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        {divider}
        <span className="h-px flex-1 bg-line" />
      </div>
      <a href="/api/auth/google" className={buttonSecondary}>
        {label}
      </a>
    </>
  );
}
