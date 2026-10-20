import "server-only";

import { and, eq, inArray, ne } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { fetchCatalogCover } from "@/lib/book-lookup";
import { logEvent } from "./events";
import type { BookInput } from "./book-input";
import { PhotoError, storeBookPhoto, type StoredPhoto } from "./photos";
import { removeFiles } from "./storage";

const { books, bookPhotos } = schema;

export class BookError extends Error {}

async function storePhotos(bookId: number, input: BookInput, files: File[]) {
  const stored: StoredPhoto[] = [];
  if (input.catalogId) {
    const cover = await fetchCatalogCover(input.catalogId);
    if (!cover) throw new BookError("Обложка из каталога не загрузилась. Сфотографируйте свою.");
    stored.push(await storeBookPhoto(bookId, cover));
  }
  for (const file of files) stored.push(await storeBookPhoto(bookId, Buffer.from(await file.arrayBuffer())));
  return stored;
}

function fields(input: BookInput) {
  return {
    title: input.title,
    author: input.author,
    ageGroups: input.ageGroups,
    category: input.category,
    themes: input.themes,
    condition: input.condition,
    mode: input.mode,
    lendDays: input.lendDays,
    note: input.note,
  };
}

export async function createBook(owner: { id: string; zoneId: number }, input: BookInput, files: File[]) {
  if (!input.catalogId && files.length === 0) throw new BookError("Добавьте фото обложки");
  const db = await getDb();
  const [book] = await db
    .insert(books)
    .values({ ...fields(input), ownerId: owner.id, zoneId: owner.zoneId })
    .returning({ id: books.id });

  try {
    const photos = await storePhotos(book.id, input, files);
    await db.insert(bookPhotos).values(photos.map((photo, sort) => ({ ...photo, bookId: book.id, sort })));
  } catch (error) {
    await db.delete(books).where(eq(books.id, book.id));
    await removeFiles(`books/${book.id}`);
    if (error instanceof PhotoError || error instanceof BookError) throw new BookError(error.message);
    throw error;
  }

  await logEvent("book_created", owner.id, { bookId: book.id });
  return book.id;
}

async function ownBook(ownerId: string, bookId: number) {
  const db = await getDb();
  const [book] = await db
    .select({ id: books.id, status: books.status })
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.ownerId, ownerId)));
  return book ?? null;
}

/** Правка книги владельцем. Новые фото, если есть, заменяют старые целиком. */
export async function updateBook(ownerId: string, bookId: number, input: BookInput, files: File[]) {
  const book = await ownBook(ownerId, bookId);
  if (!book || book.status === "removed") throw new BookError("Книга не найдена");
  const db = await getDb();
  const replacePhotos = files.length > 0 || input.catalogId !== null;

  let fresh: StoredPhoto[] = [];
  if (replacePhotos) {
    try {
      fresh = await storePhotos(bookId, input, files);
    } catch (error) {
      if (error instanceof PhotoError || error instanceof BookError) throw new BookError(error.message);
      throw error;
    }
  }

  const old = replacePhotos
    ? await db.select({ path: bookPhotos.path }).from(bookPhotos).where(eq(bookPhotos.bookId, bookId))
    : [];
  await db.transaction(async (tx) => {
    await tx
      .update(books)
      .set({ ...fields(input), confirmedAt: new Date() })
      .where(eq(books.id, bookId));
    if (replacePhotos) {
      await tx.delete(bookPhotos).where(eq(bookPhotos.bookId, bookId));
      await tx.insert(bookPhotos).values(fresh.map((photo, sort) => ({ ...photo, bookId, sort })));
    }
  });
  for (const photo of old) {
    for (const width of [320, 800, 1600]) await removeFiles(`${photo.path}-${width}.webp`);
  }
}

/** Скрыть книгу или вернуть на полку. Работает только для свободных и скрытых книг. */
export async function setBookHidden(ownerId: string, bookId: number, hidden: boolean) {
  const book = await ownBook(ownerId, bookId);
  if (!book) return false;
  const from = hidden ? "available" : "hidden";
  if (book.status !== from) return false;
  const db = await getDb();
  await db
    .update(books)
    .set({ status: hidden ? "hidden" : "available", confirmedAt: new Date() })
    .where(eq(books.id, bookId));
  return true;
}

export async function deleteBook(ownerId: string, bookId: number) {
  const book = await ownBook(ownerId, bookId);
  if (!book) return false;
  const db = await getDb();
  await db.delete(books).where(eq(books.id, bookId));
  await removeFiles(`books/${bookId}`);
  return true;
}

/** «Хочу» в фазе 1: записывает интерес к книгам. Свои книги и скрытые не считаются. */
export async function recordInterest(userId: string, bookIds: number[]) {
  const unique = [...new Set(bookIds)].filter((id) => Number.isSafeInteger(id) && id > 0).slice(0, 50);
  if (unique.length === 0) return 0;
  const db = await getDb();
  const eligible = await db
    .select({ id: books.id })
    .from(books)
    .where(
      and(
        inArray(books.id, unique),
        ne(books.ownerId, userId),
        inArray(books.status, ["available", "reserved", "on_loan"]),
      ),
    );
  if (eligible.length === 0) return 0;
  const inserted = await db
    .insert(schema.interests)
    .values(eligible.map((book) => ({ bookId: book.id, userId })))
    .onConflictDoNothing()
    .returning({ bookId: schema.interests.bookId });
  for (const item of inserted) await logEvent("interest", userId, { bookId: item.bookId });
  return eligible.length;
}
