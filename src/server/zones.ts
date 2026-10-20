import "server-only";

import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export async function getActiveZones() {
  const db = await getDb();
  return db
    .select({ id: schema.zones.id, name: schema.zones.name })
    .from(schema.zones)
    .where(eq(schema.zones.isActive, true))
    .orderBy(asc(schema.zones.sort), asc(schema.zones.name));
}
