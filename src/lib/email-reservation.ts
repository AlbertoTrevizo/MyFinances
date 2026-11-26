export type EmailSlot = { id: string };
export type EmailReservation = EmailSlot | "limited" | "failed";
export type SendResult = "sent" | "limited" | "failed";

// The callback may rotate links only after a slot has been secured.
export async function withEmailSlot(
  reserve: () => Promise<EmailReservation>,
  deliver: (slot: EmailSlot) => Promise<SendResult>,
  release: (slot: EmailSlot) => Promise<void>,
): Promise<SendResult> {
  const slot = await reserve();
  if (slot === "limited" || slot === "failed") return slot;
  try {
    const result = await deliver(slot);
    if (result !== "sent") await release(slot);
    return result;
  } catch (error) {
    await release(slot);
    throw error;
  }
}
