"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteAccount, updateProfile } from "@/server/account";
import { endSession, requireMember } from "@/server/session";
import { getActiveZones } from "@/server/zones";

export type ProfileState = { error?: string; saved?: number } | undefined;

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Напишите, как вас называть").max(40, "Имя — до 40 знаков"),
  zoneId: z.coerce.number().int().positive("Выберите, где вы живёте"),
  contact: z.string().trim().max(100, "Контакт — до 100 знаков").optional(),
});

export async function saveProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireMember("/profile");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const zones = await getActiveZones();
  if (!zones.some((zone) => zone.id === parsed.data.zoneId)) return { error: "Выберите, где вы живёте" };
  await updateProfile(user.id, { ...parsed.data, contact: parsed.data.contact || null });
  return { saved: Date.now() };
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function removeAccount(formData: FormData) {
  const user = await requireMember("/profile/delete");
  if (formData.get("confirm") !== "on") redirect("/profile/delete?error=confirm");
  await endSession();
  await deleteAccount(user.id);
  redirect("/?deleted=1");
}
