import { prisma } from "./prisma";
import { logEvent } from "./log";

export type SendResult = "sent" | "limited" | "failed";

const HOUR_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 3;
type Message = { to: string; subject: string; html: string; senderName: string };

// skipLimit: for notices that RF-12 does not count (the old-address notice of an email change).
export async function sendEmail(
  message: Message,
  options: { skipLimit?: boolean } = {}
): Promise<SendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM;
  const production = process.env.NODE_ENV === "production";
  let rowId: string | null = null;

  try {
    if (production && (!apiKey || !from)) {
      logEvent("email_send_failed", { reason: "not_configured" });
      return "failed";
    }

    if (!options.skipLimit) {
      const now = Date.now();
      await prisma.emailSend.deleteMany({ where: { createdAt: { lt: new Date(now - HOUR_MS) } } });
      // Insert first, then count: two simultaneous requests can't both slip under the cap.
      const row = await prisma.emailSend.create({ data: { recipient: message.to } });
      rowId = row.id;
      const recent = await prisma.emailSend.count({
        where: { recipient: message.to, createdAt: { gte: new Date(now - HOUR_MS) } },
      });
      if (recent > MAX_PER_HOUR) {
        await prisma.emailSend.delete({ where: { id: rowId } });
        return "limited";
      }
    }

    if (!apiKey) {
      // Development only: print the email so its link can be opened.
      console.log(`[email to ${message.to}] ${message.subject}\n${message.html}`);
      return "sent";
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { email: from, name: message.senderName },
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      await releaseRow(rowId);
      logEvent("email_send_failed", { status: response.status });
      return "failed";
    }
    return "sent";
  } catch {
    await releaseRow(rowId);
    logEvent("email_send_failed", { reason: "exception" });
    return "failed";
  }
}

async function releaseRow(id: string | null) {
  if (id) await prisma.emailSend.delete({ where: { id } }).catch(() => {});
}
