import "server-only";

import { and, asc, count, desc, eq, gte, inArray, ne, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { CollectionFilter } from "@/lib/collections";
import {
  CATALOG_STATUSES,
  type AgeGroup,
  type BookMode,
  type BookStatus,
  type Category,
  type Condition,
  type LendDays,
  type Theme,
} from "@/lib/dictionaries";

// Единственное место, где книги читаются из базы для показа. Ответы собираются из явного
// списка полей: почта, контакт и данные входа владельца сюда не попадают.

const { books, bookPhotos, users, zones } = schema;

export type BookPhoto = { path: string; width: number; height: number };

export type PublicBook = {
  id: number;
  title: string;
  author: string | null;
  ageGroups: AgeGroup[];
  category: Category | null;
  themes: Theme[];
  condition: Condition;
  mode: BookMode;
  lendDays: LendDays | null;
  note: string | null;
  status: BookStatus;
  createdAt: string;
  owner: { id: string; displayName: string };
  zone: string;
  photos: BookPhoto[];
};

export type OwnBook = PublicBook & { moderationReason: string | null; interestCount: number };

const PUBLIC_COLUMNS = {
  id: books.id,
  title: books.title,
  author: books.author,
  ageGroups: books.ageGroups,
  category: books.category,
  themes: books.themes,
  condition: books.condition,
  mode: books.mode,
  lendDays: books.lendDays,
  note: books.note,
  status: books.status,
  createdAt: books.createdAt,
  ownerId: users.id,
  ownerName: users.displayName,
  zone: zones.name,
};

type Row = {
  id: number;
  title: string;
  author: string | null;
  ageGroups: string[];
  category: string | null;
  themes: string[];
  condition: string;
  mode: BookMode;
  lendDays: number | null;
  note: string | null;
  status: BookStatus;
  createdAt: Date;
  ownerId: string;
  ownerName: string | null;
  zone: string;
};

async function withPhotos(rows: Row[]): Promise<PublicBook[]> {
  if (rows.length === 0) return [];
  const db = await getDb();
  const photos = await db
    .select({
      bookId: bookPhotos.bookId,
      path: bookPhotos.path,
      width: bookPhotos.width,
      height: bookPhotos.height,
    })
    .from(bookPhotos)
    .where(inArray(bookPhotos.bookId, rows.map((row) => row.id)))
    .orderBy(asc(bookPhotos.sort), asc(bookPhotos.id));
  const byBook = new Map<number, BookPhoto[]>();
  for (const { bookId, ...photo } of photos) {
    byBook.set(bookId, [...(byBook.get(bookId) ?? []), photo]);
  }
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    ageGroups: row.ageGroups as AgeGroup[],
    category: row.category as Category | null,
    themes: row.themes as Theme[],
    condition: row.condition as Condition,
    mode: row.mode,
    lendDays: row.lendDays as LendDays | null,
    note: row.note,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    owner: { id: row.ownerId, displayName: row.ownerName ?? "Сосед" },
    zone: row.zone,
    photos: byBook.get(row.id) ?? [],
  }));
}

function baseQuery(db: Awaited<ReturnType<typeof getDb>>) {
  return db
    .select(PUBLIC_COLUMNS)
    .from(books)
    .innerJoin(users, eq(users.id, books.ownerId))
    .innerJoin(zones, eq(zones.id, books.zoneId));
}

const visibleInCatalog = () =>
  and(inArray(books.status, [...CATALOG_STATUSES]), eq(users.status, "active"));

export type CatalogFilters = CollectionFilter & {
  q?: string;
  theme?: Theme;
  mode?: BookMode;
  zoneId?: number;
};

export const CATALOG_PAGE = 40;

/** Порог похожести для поиска с опечатками (pg_trgm, word_similarity). */
const FUZZY_THRESHOLD = 0.35;

export async function searchCatalog(filters: CatalogFilters, page = 0) {
  const db = await getDb();
  const where: (SQL | undefined)[] = [visibleInCatalog()];
  if (filters.age) where.push(sql`${filters.age} = any(${books.ageGroups})`);
  if (filters.category) where.push(eq(books.category, filters.category));
  if (filters.anyTheme) where.push(sql`cardinality(${books.themes}) > 0`);
  if (filters.theme) where.push(sql`${filters.theme} = any(${books.themes})`);
  if (filters.mode) where.push(eq(books.mode, filters.mode));
  if (filters.zoneId) where.push(eq(books.zoneId, filters.zoneId));

  const q = filters.q?.trim().slice(0, 100);
  const haystack = sql`(${books.title} || ' ' || coalesce(${books.author}, ''))`;
  const order: SQL[] = [];
  if (q) {
    const tsquery = sql`websearch_to_tsquery('russian', ${q})`;
    const similarity = sql`word_similarity(${q}, ${haystack})`;
    where.push(sql`(${books.search} @@ ${tsquery} or ${similarity} >= ${FUZZY_THRESHOLD})`);
    order.push(sql`greatest(ts_rank(${books.search}, ${tsquery}), ${similarity}) desc`);
  }
  order.push(desc(books.createdAt), desc(books.id));

  const rows = await baseQuery(db)
    .where(and(...where))
    .orderBy(...order)
    .limit(CATALOG_PAGE + 1)
    .offset(page * CATALOG_PAGE);
  return {
    books: await withPhotos(rows.slice(0, CATALOG_PAGE)),
    hasMore: rows.length > CATALOG_PAGE,
  };
}

/**
 * Книга для страницы книги. Чужие видят её только в статусах каталога;
 * владелец и модератор — в любом, кроме удалённой.
 */
export async function getBook(id: number, viewer: { id: string; role: string } | null) {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const db = await getDb();
  const [row] = await baseQuery(db).where(eq(books.id, id));
  if (!row) return null;
  const isOwner = viewer?.id === row.ownerId;
  const visible =
    isOwner ||
    viewer?.role === "admin" ||
    ((CATALOG_STATUSES as readonly string[]).includes(row.status) && (await ownerActive(row.ownerId)));
  if (!visible) return null;
  const [book] = await withPhotos([row]);
  return { book, isOwner };
}

async function ownerActive(ownerId: string) {
  const db = await getDb();
  const [row] = await db.select({ status: users.status }).from(users).where(eq(users.id, ownerId));
  return row?.status === "active";
}

export async function getNeighborBooks(ownerId: string) {
  const db = await getDb();
  const rows = await baseQuery(db)
    .where(and(eq(books.ownerId, ownerId), visibleInCatalog()))
    .orderBy(desc(books.createdAt), desc(books.id));
  return withPhotos(rows);
}

/** «Моя полка»: все книги участника, кроме удалённых, с причиной снятия и числом «Хочу». */
export async function getOwnBooks(userId: string): Promise<OwnBook[]> {
  const db = await getDb();
  const rows = await db
    .select({ ...PUBLIC_COLUMNS, moderationReason: books.moderationReason })
    .from(books)
    .innerJoin(users, eq(users.id, books.ownerId))
    .innerJoin(zones, eq(zones.id, books.zoneId))
    .where(eq(books.ownerId, userId))
    .orderBy(desc(books.createdAt), desc(books.id));
  const counts = rows.length
    ? await db
        .select({ bookId: schema.interests.bookId, n: count() })
        .from(schema.interests)
        .where(inArray(schema.interests.bookId, rows.map((row) => row.id)))
        .groupBy(schema.interests.bookId)
    : [];
  const countMap = new Map(counts.map((item) => [item.bookId, item.n]));
  const withPhotosList = await withPhotos(rows);
  return withPhotosList.map((book, index) => ({
    ...book,
    moderationReason: rows[index].moderationReason,
    interestCount: countMap.get(book.id) ?? 0,
  }));
}

/** Сколько книг участник выложил за последние сутки — для ограничения в 100. */
export async function booksCreatedToday(userId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ n: count() })
    .from(books)
    .where(and(eq(books.ownerId, userId), gte(books.createdAt, new Date(Date.now() - 24 * 3600 * 1000))));
  return row?.n ?? 0;
}

/** Возраст и пометка последней книги — подставляются в форму «Добавить ещё одну». */
export async function lastBookDefaults(userId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ ageGroups: books.ageGroups, mode: books.mode, lendDays: books.lendDays })
    .from(books)
    .where(and(eq(books.ownerId, userId), ne(books.status, "removed")))
    .orderBy(desc(books.createdAt), desc(books.id))
    .limit(1);
  return row
    ? {
        ageGroups: row.ageGroups as AgeGroup[],
        mode: row.mode,
        lendDays: (row.lendDays ?? 30) as LendDays,
      }
    : null;
}
