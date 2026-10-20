"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { LEGAL_DOCS } from "@/lib/legal";
import { logEvent } from "@/server/events";
import { getCurrentUser, safeNext } from "@/server/session";
import { getActiveZones } from "@/server/zones";
import { getOwnProfile } from "@/server/users";

export type FormState = { error?: string } | undefined;

const welcomeSchema = z.object({
  displayName: z.string().trim().min(1, "Напишите, как вас называть").max(40, "Имя — до 40 знаков"),
  zoneId: z.coerce.number().int().positive("Выберите, где вы живёте"),
  email: z.union([z.literal(""), z.email("Проверьте почту")]).optional(),
  contact: z.string().trim().max(100, "Контакт — до 100 знаков").optional(),
  adult: z.literal("on", { error: "Сервис — только для взрослых" }),
  consent: z.literal("on", { error: "Нужно согласие на обработку данных" }),
  rules: z.literal("on", { error: "Нужно согласие с правилами" }),
});

export async function completeWelcome(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = welcomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const zones = await getActiveZones();
  if (!zones.some((zone) => zone.id === data.zoneId)) return { error: "Выберите, где вы живёте" };

  const profile = await getOwnProfile(user.id);
  if (!profile) redirect("/login");
  const email = profile.email ?? (data.email ? data.email.toLowerCase() : null);
  if (!email) return { error: "Укажите почту — на неё придут письма о книгах" };

  const db = await getDb();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({
        displayName: data.displayName,
        zoneId: data.zoneId,
        email,
        contact: data.contact || null,
        adultConfirmedAt: now,
      })
      .where(eq(schema.users.id, user.id));
    await tx.insert(schema.consents).values([
      { userId: user.id, doc: "consent", docVersion: LEGAL_DOCS.consent.version, acceptedAt: now },
      { userId: user.id, doc: "rules", docVersion: LEGAL_DOCS.rules.version, acceptedAt: now },
    ]);
  });
  await logEvent("user_onboarded", user.id);
  redirect(safeNext(formData.get("next")));
}
