// A plain link on purpose: CSP form-action 'self' would block a form that redirects to Google, and next/link may prefetch.
export function GoogleSignIn({ label, divider }: { label: string; divider: string }) {
  return (
    <>
      <a href="/api/auth/google" aria-label={label} className="mx-auto flex size-12 items-center justify-center rounded-full border border-line hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" className="size-6">
          <path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h10.99a9.4 9.4 0 0 1-4.07 6.17v5h6.6c3.86-3.55 6.09-8.78 6.09-14.67Z" />
          <path fill="#34A853" d="M24 44c5.5 0 10.1-1.83 13.47-4.87l-6.6-5c-1.83 1.23-4.17 1.98-6.87 1.98-5.3 0-9.8-3.58-11.4-8.4H5.8v5.15A20 20 0 0 0 24 44Z" />
          <path fill="#FBBC05" d="M12.6 27.71a12 12 0 0 1 0-7.42v-5.15H5.8a20 20 0 0 0 0 17.72l6.8-5.15Z" />
          <path fill="#EA4335" d="M24 11.89c3 0 5.67 1.03 7.8 3.06l5.85-5.85A19.48 19.48 0 0 0 24 4 20 20 0 0 0 5.8 15.14l6.8 5.15c1.6-4.82 6.1-8.4 11.4-8.4Z" />
        </svg>
      </a>
      <p className="mt-4 mb-6 text-center text-xs text-ink-muted">{divider}</p>
    </>
  );
}
