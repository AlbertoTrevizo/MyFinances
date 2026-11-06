import { appUrl } from "./app-url";
import { logEvent } from "./log";
import { sendEmail, type SendResult } from "./email";
import type { Dictionary } from "@/i18n/dictionaries";

export type AccountEmailKind =
  | "confirm"
  | "emailChange"
  | "reset"
  | "accountExists"
  | "emailChangeNotice";

const PATHS: Partial<Record<AccountEmailKind, string>> = {
  confirm: "/confirm-email",
  emailChange: "/confirm-email",
  reset: "/reset-password",
  accountExists: "/forgot-password",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Emails hold only dictionary text and one link: never the person's name or anything they typed.
export async function sendAccountEmail(
  kind: AccountEmailKind,
  to: string,
  t: Dictionary,
  token?: string
): Promise<SendResult> {
  const copy = t.emails[kind];
  const path = PATHS[kind];
  let body = `<p>${escapeHtml(copy.intro)}</p>`;

  if (path) {
    const base = appUrl();
    if (!base) {
      logEvent("email_send_failed", { reason: "app_url_missing" });
      return "failed";
    }
    const url = new URL(path, base);
    if (token) url.searchParams.set("token", token);
    const href = escapeHtml(url.toString());
    const button = "button" in copy ? copy.button : "";
    body +=
      `<p><a href="${href}">${escapeHtml(button)}</a></p>` +
      `<p>${escapeHtml(t.emails.linkFallback)}<br>${href}</p>`;
  }
  body += `<p>${escapeHtml(t.emails.ignore)}</p>`;

  return sendEmail(
    { to, subject: copy.subject, html: body, senderName: t.appName },
    { skipLimit: kind === "emailChangeNotice" }
  );
}
