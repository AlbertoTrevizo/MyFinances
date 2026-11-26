import { prisma } from "./prisma";
import { logEvent } from "./log";

import type { EmailReservation, EmailSlot, SendResult } from "./email-reservation";
export type { SendResult } from "./email-reservation";

const HOUR_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 3;
const MAX_GLOBAL_PER_HOUR = 50;
type Message = { to: string; subject: string; html: string; senderName: string };

export async function reserveEmailSlot(recipient: string): Promise<EmailReservation> {
  let slot: EmailSlot | null = null;
  try {
    const since = new Date(Date.now() - HOUR_MS);
    await prisma.emailSend.deleteMany({ where: { createdAt: { lt: since } } });
    // Insert first, then count both limits, including simultaneous reservations.
    slot = await prisma.emailSend.create({ data: { recipient } });
    const [recent, total] = await Promise.all([
      prisma.emailSend.count({ where: { recipient, createdAt: { gte: since } } }),
      prisma.emailSend.count({ where: { createdAt: { gte: since } } }),
    ]);
    if (total > MAX_GLOBAL_PER_HOUR) logEvent("email_global_limit");
    if (recent > MAX_PER_HOUR || total > MAX_GLOBAL_PER_HOUR) {
      await releaseEmailSlot(slot);
      return "limited";
    }
    return slot;
  } catch {
    if (slot) await releaseEmailSlot(slot);
    logEvent("email_send_failed", { reason: "reservation_failed" });
    return "failed";
  }
}

export async function releaseEmailSlot(slot: EmailSlot): Promise<void> {
  await prisma.emailSend.deleteMany({ where: { id: slot.id } }).catch(() => {});
}

// The caller has already reserved its counted slot (or sends an exempt notice).
export async function sendEmail(message: Message): Promise<SendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM;
  const production = process.env.NODE_ENV === "production";
  try {
    if (production && (!apiKey || !from)) {
      logEvent("email_send_failed", { reason: "not_configured" });
      return "failed";
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
      logEvent("email_send_failed", { status: response.status });
      return "failed";
    }
    return "sent";
  } catch {
    logEvent("email_send_failed", { reason: "exception" });
    return "failed";
  }
}
