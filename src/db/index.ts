// Подключение к базе. На сервере — PostgreSQL по `DATABASE_URL`.
// Без `DATABASE_URL` (разработка и тесты) — PGlite: тот же PostgreSQL внутри Node,
// данные в `.data/pglite` или в памяти (`DATABASE_URL=memory`). См. DECISIONS.md.

import { mkdirSync } from "node:fs";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(/*turbopackIgnore: true*/ process.cwd(), "drizzle");

/** В пилоте один район (PRD, раздел 9). Зоны добавляет владелец в админке. */
async function ensureDistrict(db: Db) {
  await db
    .insert(schema.districts)
    .values({ slug: "pavshinskaya-poyma", name: "Павшинская пойма" })
    .onConflictDoNothing();
}

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;

  if (url && url !== "memory") {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const db = drizzle(new Pool({ connectionString: url, max: 10 }), { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    await ensureDistrict(db as unknown as Db);
    return db as unknown as Db;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { pg_trgm } = await import("@electric-sql/pglite/contrib/pg_trgm");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dataDir =
    url === "memory" ? undefined : path.resolve(/*turbopackIgnore: true*/ process.env.PGLITE_DIR || path.join(process.cwd(), ".data", "pglite"));
  if (dataDir) mkdirSync(/*turbopackIgnore: true*/ path.dirname(dataDir), { recursive: true });
  const client = new PGlite({ dataDir, extensions: { pg_trgm } });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  await ensureDistrict(db as unknown as Db);
  return db as unknown as Db;
}

// Одно подключение на процесс, в том числе при горячей перезагрузке в разработке.
const globalForDb = globalThis as unknown as { dbPromise?: Promise<Db> };

export function getDb(): Promise<Db> {
  globalForDb.dbPromise ??= connect().catch((error) => {
    globalForDb.dbPromise = undefined;
    throw error;
  });
  return globalForDb.dbPromise;
}

/** Только для тестов: следующее обращение откроет новую базу. */
export function resetDbForTests() {
  globalForDb.dbPromise = undefined;
}

export { schema };
