// Готовит чистую базу для сквозных тестов: район и одна зона.

import { rm } from "node:fs/promises";
import { getDb, schema } from "@/db";

async function main() {
  await rm(process.env.PGLITE_DIR!, { recursive: true, force: true });
  await rm(process.env.UPLOAD_DIR!, { recursive: true, force: true });
  const db = await getDb();
  const [district] = await db.select().from(schema.districts).limit(1);
  await db.insert(schema.zones).values({ districtId: district.id, name: "Тестовый квартал" });
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
