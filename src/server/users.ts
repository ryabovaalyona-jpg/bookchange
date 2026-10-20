import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

/** Профиль для самого участника: здесь можно отдавать закрытые поля. */
export async function getOwnProfile(userId: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      id: schema.users.id,
      displayName: schema.users.displayName,
      zoneId: schema.users.zoneId,
      email: schema.users.email,
      contact: schema.users.contact,
      adultConfirmedAt: schema.users.adultConfirmedAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  return row ?? null;
}

export type PublicNeighbor = { id: string; displayName: string; zone: string };

/** Публичная карточка участника: имя и зона. Без почты, контакта и данных входа. */
export async function getNeighbor(userId: string): Promise<PublicNeighbor | null> {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
  const db = await getDb();
  const [row] = await db
    .select({ id: schema.users.id, displayName: schema.users.displayName, zone: schema.zones.name })
    .from(schema.users)
    .innerJoin(schema.zones, eq(schema.zones.id, schema.users.zoneId))
    .where(and(eq(schema.users.id, userId), eq(schema.users.status, "active")));
  return row && row.displayName ? { ...row, displayName: row.displayName } : null;
}
