import "server-only";

import { getDb, schema } from "@/db";

export type EventType =
  | "user_signed_up"
  | "user_onboarded"
  | "book_created"
  | "interest"
  | "report_created"
  | "animi_click"
  | "account_deleted";

/** Журнал для счётчиков и гейтов. В `payload` — только идентификаторы, без личных данных. */
export async function logEvent(type: EventType, userId: string | null, payload?: Record<string, unknown>) {
  const db = await getDb();
  await db.insert(schema.events).values({ type, userId, payload });
}
