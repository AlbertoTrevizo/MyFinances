export type BookAccess = "owner" | "editor" | "viewer";

export function canWrite(access: BookAccess): boolean {
  return access === "owner" || access === "editor";
}

export function canManage(access: BookAccess): boolean {
  return access === "owner";
}

export function parseMemberRole(value: unknown): "editor" | "viewer" | null {
  return value === "editor" || value === "viewer" ? value : null;
}

export function validateBookName(raw: string): { name: string } | { error: "required" | "tooLong" } {
  const name = raw.trim();
  if (!name) return { error: "required" };
  if (name.length > 100) return { error: "tooLong" };
  return { name };
}

export function pickActiveBook(
  rememberedId: string | null,
  books: { id: string; access: BookAccess; joinedAt: Date }[],
): string | null {
  const remembered = books.find((book) => book.id === rememberedId);
  if (remembered) return remembered.id;
  const oldestFirst = [...books].sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
  return (oldestFirst.find((book) => book.access === "owner") ?? oldestFirst[0])?.id ?? null;
}

export function pickNewOwner(
  members: { userId: string; role: "editor" | "viewer"; createdAt: Date }[],
): string | null {
  return members
    .filter((member) => member.role === "editor")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]?.userId ?? null;
}

export function invitationDecision({
  invitation,
  now,
  userEmail,
  access,
}: {
  invitation: { email: string | null; expiresAt: Date } | null;
  now: Date;
  userEmail: string;
  access: BookAccess | null;
}): "invalid" | "wrongAccount" | "alreadyMember" | "accept" {
  if (!invitation || invitation.expiresAt <= now) return "invalid";
  if (invitation.email !== null && invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    return "wrongAccount";
  }
  if (access !== null) return "alreadyMember";
  return "accept";
}

export function invitationReturnPath(value: string | undefined): string | null {
  return value !== undefined && /^\/invitations\?token=[0-9a-f]{64}$/.test(value) ? value : null;
}
