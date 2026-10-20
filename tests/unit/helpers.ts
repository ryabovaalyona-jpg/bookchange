import { getDb, schema } from "@/db";

let counter = 0;

/** Участник, прошедший знакомство, в первой зоне района. */
export async function makeMember(name = "Сосед") {
  const db = await getDb();
  let [zone] = await db.select().from(schema.zones).limit(1);
  if (!zone) {
    const [district] = await db.select().from(schema.districts).limit(1);
    [zone] = await db.insert(schema.zones).values({ districtId: district.id, name: "Тестовая зона" }).returning();
  }
  counter += 1;
  const [user] = await db
    .insert(schema.users)
    .values({
      provider: "dev",
      providerUserId: `unit-${Date.now()}-${counter}`,
      displayName: name,
      zoneId: zone.id,
      email: `unit${counter}@example.test`,
      contact: `+7 900 000-00-${String(counter).padStart(2, "0")}`,
      adultConfirmedAt: new Date(),
    })
    .returning();
  return { ...user, zoneId: zone.id };
}

export async function makeBook(ownerId: string, zoneId: number, title: string, author: string | null = null) {
  const db = await getDb();
  const [book] = await db
    .insert(schema.books)
    .values({ ownerId, zoneId, title, author, ageGroups: ["5-6"], condition: "good" })
    .returning();
  return book;
}
