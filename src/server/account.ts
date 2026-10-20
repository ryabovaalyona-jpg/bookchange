import "server-only";

import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { logEvent } from "./events";
import { removeFiles } from "./storage";

export async function updateProfile(
  userId: string,
  data: { displayName: string; zoneId: number; contact: string | null },
) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ displayName: data.displayName, zoneId: data.zoneId, contact: data.contact })
      .where(eq(schema.users.id, userId));
    // Книги показываются с зоной владельца.
    await tx.update(schema.books).set({ zoneId: data.zoneId }).where(eq(schema.books.ownerId, userId));
  });
}

/**
 * Удаление аккаунта (PRD, раздел 9): стирает профиль, книги, фото, согласия и сессии.
 * Записи журнала остаются обезличенными: `user_id` становится пустым.
 */
export async function deleteAccount(userId: string) {
  const db = await getDb();
  const owned = await db
    .select({ id: schema.books.id })
    .from(schema.books)
    .where(eq(schema.books.ownerId, userId));
  await db.delete(schema.users).where(eq(schema.users.id, userId));
  for (const book of owned) await removeFiles(`books/${book.id}`);
  await logEvent("account_deleted", null);
}
