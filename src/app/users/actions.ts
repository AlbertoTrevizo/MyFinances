"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";
import { createToken } from "@/lib/user-tokens";
import { reserveEmailSlot, releaseEmailSlot } from "@/lib/email";
import { withEmailSlot } from "@/lib/email-reservation";
import { sendAccountEmail } from "@/lib/account-emails";
import { validateProfile } from "@/lib/user-validation";
import { logEvent } from "@/lib/log";
import { resolveOwnedBooks } from "@/lib/book-data";
import { parseRole, removesLastAdmin, roleChangeError, type Role } from "@/lib/roles";

type Field = "name" | "lastName" | "email";
export type UpdateUserState =
  | {
      ok?: boolean;
      // Set when a Confirmed account's email change waits for its link.
      pendingEmailChange?: boolean;
      error?: string;
      fieldErrors?: Partial<Record<Field, string>>;
      values?: { name: string; lastName: string; email: string };
    }
  | undefined;
export type DeleteUserState = { error?: string } | undefined;
export type SetUserRoleState = { ok?: boolean; error?: string; values?: { role: string } } | undefined;

function prismaCode(error: unknown): string | null {
  return error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null;
}

export async function updateUser(
  id: string,
  _prev: UpdateUserState,
  formData: FormData
): Promise<UpdateUserState> {
  const admin = await requireAdmin();
  const { t } = await getTranslations();

  const { values, errors } = validateProfile({
    name: String(formData.get("name") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  const fieldErrors: Partial<Record<Field, string>> = {};
  for (const [field, code] of Object.entries(errors)) fieldErrors[field as Field] = t.validation[code];
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: t.users.errors.notFound, values };

  const taken = { fieldErrors: { email: t.users.errors.emailTaken }, values };
  const other = await prisma.user.findUnique({ where: { email: values.email } });
  if (other && other.id !== id) return taken;

  const names = { name: values.name, lastName: values.lastName };
  let token: string | null = null;
  let pendingEmailChange = false;

  try {
    if (values.email === target.email) {
      await prisma.user.update({ where: { id }, data: names });
    } else {
      pendingEmailChange = target.emailVerifiedAt !== null;
      const sent = await withEmailSlot(
        () => reserveEmailSlot(values.email),
        async (slot) => {
          token = await createToken(pendingEmailChange ? "email_change" : "confirm", async (tx) => {
            await tx.user.update({
              where: { id },
              data: pendingEmailChange ? names : { ...names, email: values.email },
            });
            return id;
          }, pendingEmailChange ? values.email : undefined);
          return sendAccountEmail(pendingEmailChange ? "emailChange" : "confirm", values.email, t, token!, slot);
        },
        releaseEmailSlot,
      );
      if (sent === "limited") await prisma.user.update({ where: { id }, data: names });
      if (sent === "failed") {
        if (token) logEvent("user_updated", { userId: id, by: admin.id, emailChange: true });
        revalidatePath("/users");
        return { error: t.users.errors.emailNotSent, values };
      }
      // The old-address notice is exempt and only follows a delivered change link.
      if (pendingEmailChange && sent === "sent") await sendAccountEmail("emailChangeNotice", target.email, t);
    }
  } catch (error) {
    const code = prismaCode(error);
    if (code === "P2002") return taken;
    if (code === "P2025") return { error: t.users.errors.notFound, values };
    throw error;
  }

  logEvent("user_updated", { userId: id, by: admin.id, emailChange: token !== null });

  revalidatePath("/users");
  return { ok: true, pendingEmailChange };
}

export async function deleteUser(id: string): Promise<DeleteUserState> {
  const admin = await requireAdmin();
  const { t } = await getTranslations();

  let outcome: Awaited<ReturnType<typeof resolveOwnedBooks>> | "gone" | "lastAdmin";
  try {
    outcome = await prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({ where: { id }, select: { role: true } });
        if (!target) return "gone" as const;
        const adminCount = await tx.user.count({ where: { role: "admin" } });
        if (removesLastAdmin(target.role, adminCount)) {
          return "lastAdmin" as const;
        }
        const events = await resolveOwnedBooks(tx, id);
        // Sessions, links and remaining memberships go with the user (cascade); owned books are resolved above.
        await tx.user.delete({ where: { id } });
        return events;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    // P2034: a concurrent transaction conflicted; nothing was deleted, so ask to retry (the retry gets the accurate answer).
    const code = prismaCode(error);
    if (code === "P2034") return { error: t.users.errors.conflict };
    if (code === "P2025") return { error: t.users.errors.notFound };
    throw error;
  }

  if (outcome === "gone") return { error: t.users.errors.notFound };
  if (outcome === "lastAdmin") return { error: t.users.errors.lastAdmin };

  for (const { event, data } of outcome) logEvent(event, data);
  logEvent("user_deleted", { userId: id, by: admin.id });
  if (id === admin.id) redirect("/login");
  revalidatePath("/users");
  return undefined;
}

export async function setUserRole(
  id: string,
  _prev: SetUserRoleState,
  formData: FormData
): Promise<SetUserRoleState> {
  const admin = await requireAdmin();
  const { t } = await getTranslations();
  const values = { role: String(formData.get("role") ?? "") };
  const role = parseRole(formData.get("role"));
  if (!role) return { error: t.auth.errors.generic, values };

  let outcome: { error: "notFound" | "lastAdmin" | "pendingAdmin" } | { from: Role; changed: boolean };
  try {
    outcome = await prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({
          where: { id },
          select: { role: true, emailVerifiedAt: true },
        });
        if (!target) return { error: "notFound" as const };
        const adminCount = await tx.user.count({ where: { role: "admin" } });
        const error = roleChangeError({
          targetConfirmed: target.emailVerifiedAt !== null,
          from: target.role,
          to: role,
          adminCount,
        });
        if (error) return { error };
        const changed = target.role !== role;
        if (changed) await tx.user.update({ where: { id }, data: { role } });
        return { from: target.role, changed };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    const code = prismaCode(error);
    if (code === "P2034") return { error: t.users.errors.conflict, values };
    if (code === "P2025") return { error: t.users.errors.notFound, values };
    throw error;
  }

  if ("error" in outcome) {
    return { error: t.users.errors[outcome.error === "lastAdmin" ? "lastAdminRole" : outcome.error], values };
  }
  if (outcome.changed) {
    logEvent("user_role_changed", { userId: id, by: admin.id, from: outcome.from, to: role });
  }
  if (id === admin.id && role === "user") redirect("/");
  revalidatePath("/users");
  return { ok: true };
}
