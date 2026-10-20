// Демо-данные для разработки: условные зоны, шесть соседей и двенадцать книг.
// Запуск: `npm run db:seed` при остановленном `npm run dev` (PGlite открывает базу одним процессом).
// На сервере не запускается: настоящие зоны владелец заводит в админке.

import { eq } from "drizzle-orm";
import sharp from "sharp";
import { getDb, schema } from "@/db";
import type { AgeGroup, BookMode, BookStatus, Category, Condition, Theme } from "@/lib/dictionaries";
import { storeBookPhoto } from "@/server/photos";

if (process.env.NODE_ENV === "production") throw new Error("seed is for development only");

const ZONES = ["У набережной", "У парка", "У метро"];

const NEIGHBORS = [
  { uid: "marina", name: "Марина", zone: 0 },
  { uid: "olga", name: "Ольга", zone: 1 },
  { uid: "katya", name: "Катя", zone: 2 },
  { uid: "anna", name: "Анна", zone: 0 },
  { uid: "irina", name: "Ирина", zone: 1 },
  { uid: "sveta", name: "Света", zone: 2 },
];

type SeedBook = {
  owner: string;
  title: string;
  author?: string;
  ageGroups: AgeGroup[];
  category?: Category;
  themes?: Theme[];
  condition: Condition;
  mode?: BookMode;
  lendDays?: number;
  note?: string;
  status?: BookStatus;
};

const BOOKS: SeedBook[] = [
  { owner: "marina", title: "Крошка Енот и тот, кто сидит в пруду", author: "Лилиан Муур", ageGroups: ["3-4", "5-6"], category: "tales", themes: ["fears"], condition: "good", note: "Читали каждый вечер целый год, уголки немного потёрты." },
  { owner: "olga", title: "Вафельное сердце", author: "Мария Парр", ageGroups: ["7-9", "10-12"], category: "stories", themes: ["friendship", "loss"], condition: "new", mode: "lend", lendDays: 30 },
  { owner: "katya", title: "Городок", author: "Ротраут Сузанна Бернер", ageGroups: ["0-2", "3-4"], category: "picture", condition: "worn" },
  { owner: "anna", title: "Денискины рассказы", author: "Виктор Драгунский", ageGroups: ["7-9"], category: "school", condition: "good" },
  { owner: "irina", title: "Петсон и Финдус. Именинный пирог", author: "Свен Нурдквист", ageGroups: ["3-4", "5-6"], category: "tales", condition: "new", mode: "lend", lendDays: 14 },
  { owner: "marina", title: "Азбука", author: "Самуил Маршак", ageGroups: ["5-6"], category: "learning", condition: "good" },
  { owner: "sveta", title: "Муми-тролль и комета", author: "Туве Янссон", ageGroups: ["5-6", "7-9"], category: "tales", themes: ["anxiety"], condition: "good" },
  { owner: "olga", title: "Цветик-семицветик", author: "Валентин Катаев", ageGroups: ["5-6", "7-9"], category: "tales", themes: ["friendship"], condition: "flawed", note: "На двух страницах рисунки фломастером, текст читается." },
  { owner: "anna", title: "Как говорить, чтобы дети слушали", author: "Адель Фабер, Элейн Мазлиш", ageGroups: ["adult"], category: "parents", condition: "good", mode: "lend", lendDays: 60 },
  { owner: "katya", title: "Зайчонок, который не хотел спать", ageGroups: ["0-2", "3-4"], category: "picture", themes: ["routine", "fear-dark"], condition: "new" },
  { owner: "irina", title: "Мой первый день в детском саду", ageGroups: ["3-4"], category: "novelty", themes: ["adaptation", "separation"], condition: "good" },
  { owner: "sveta", title: "Стихи для самых маленьких", author: "Агния Барто", ageGroups: ["0-2"], category: "poems", condition: "worn" },
];

const TONES = [
  ["#0B2E30", "#F4ECDC"],
  ["#D9B36A", "#0B2E30"],
  ["#48615F", "#F7F1E5"],
  ["#EFE6D3", "#0B2E30"],
  ["#124446", "#D9B36A"],
  ["#A9B8A9", "#0B2E30"],
];

function escape(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/** Рисует обложку-заглушку: название и автор на цветном фоне. */
async function coverImage(title: string, author: string | undefined, tone: number) {
  const [bg, ink] = TONES[tone % TONES.length];
  const words = title.split(" ");
  const lines: string[] = [];
  for (const word of words) {
    const last = lines.at(-1);
    if (last && (last + " " + word).length <= 14) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
    <rect width="600" height="800" fill="${bg}"/>
    ${lines.map((line, i) => `<text x="48" y="${130 + i * 72}" font-family="Georgia, serif" font-size="62" font-weight="600" fill="${ink}">${escape(line)}</text>`).join("")}
    ${author ? `<text x="48" y="740" font-family="Helvetica, sans-serif" font-size="30" fill="${ink}">${escape(author)}</text>` : ""}
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}

async function main() {
  const db = await getDb();
  const [district] = await db.select().from(schema.districts).limit(1);

  let zones = await db.select().from(schema.zones);
  if (zones.length === 0) {
    zones = await db
      .insert(schema.zones)
      .values(ZONES.map((name, sort) => ({ districtId: district.id, name, sort: sort * 10 })))
      .returning();
  }

  const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.provider, "demo"));
  if (existing.length > 0) {
    console.log("Демо-данные уже есть.");
    return;
  }

  const ownerIds = new Map<string, { id: string; zoneId: number }>();
  for (const neighbor of NEIGHBORS) {
    const [user] = await db
      .insert(schema.users)
      .values({
        provider: "demo",
        providerUserId: neighbor.uid,
        displayName: neighbor.name,
        zoneId: zones[neighbor.zone].id,
        email: `${neighbor.uid}@example.invalid`,
        adultConfirmedAt: new Date(),
      })
      .returning({ id: schema.users.id, zoneId: schema.users.zoneId });
    ownerIds.set(neighbor.uid, { id: user.id, zoneId: user.zoneId! });
  }

  for (const [index, item] of BOOKS.entries()) {
    const owner = ownerIds.get(item.owner)!;
    const createdAt = new Date(Date.now() - (BOOKS.length - index) * 3600 * 1000);
    const [book] = await db
      .insert(schema.books)
      .values({
        ownerId: owner.id,
        zoneId: owner.zoneId,
        title: item.title,
        author: item.author ?? null,
        ageGroups: item.ageGroups,
        category: item.category ?? null,
        themes: item.themes ?? [],
        condition: item.condition,
        mode: item.mode ?? "gift",
        lendDays: item.mode === "lend" ? (item.lendDays ?? 30) : null,
        note: item.note ?? null,
        status: item.status ?? "available",
        createdAt,
      })
      .returning({ id: schema.books.id });
    const photo = await storeBookPhoto(book.id, await coverImage(item.title, item.author, index));
    await db.insert(schema.bookPhotos).values({ ...photo, bookId: book.id });
  }
  console.log(`Готово: ${zones.length} зоны, ${NEIGHBORS.length} соседей, ${BOOKS.length} книг.`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
