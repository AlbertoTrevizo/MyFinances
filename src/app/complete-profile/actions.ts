"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";
import { validateName } from "@/lib/user-validation";

export type ProfileState =
  | { fieldErrors?: { name?: string; lastName?: string }; values?: { name: string; lastName: string } }
  | undefined;

export async function completeProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user?.emailVerifiedAt) redirect("/login");
  if (!user.profileIncomplete) redirect("/");

  const { t } = await getTranslations();
  const name = validateName(String(formData.get("name") ?? ""));
  const lastName = validateName(String(formData.get("lastName") ?? ""));
  if (name.error || lastName.error) {
    return {
      fieldErrors: {
        name: name.error && t.validation[name.error],
        lastName: lastName.error && t.validation[lastName.error],
      },
      values: { name: name.value, lastName: lastName.value },
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: name.value, lastName: lastName.value, profileIncomplete: false },
  });
  redirect("/");
}
