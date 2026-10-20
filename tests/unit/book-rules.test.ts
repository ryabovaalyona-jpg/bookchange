import { describe, expect, it } from "vitest";
import { getDb, schema } from "@/db";
import { recordInterest, setBookHidden } from "@/server/book-mutations";
import { getBook, getNeighborBooks, searchCatalog } from "@/server/books";
import { eq } from "drizzle-orm";
import { makeBook, makeMember } from "./helpers";

const PRIVATE_KEYS = ["email", "contact", "provider", "providerUserId"];

function deepKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (value && typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) {
      keys.add(key);
      deepKeys(inner, keys);
    }
  }
  return keys;
}

describe("правила книги фазы 1", () => {
  it("скрыть можно только свободную книгу, вернуть — только скрытую", async () => {
    const owner = await makeMember();
    const book = await makeBook(owner.id, owner.zoneId, "Сказки на ночь");
    expect(await setBookHidden(owner.id, book.id, false)).toBe(false);
    expect(await setBookHidden(owner.id, book.id, true)).toBe(true);
    expect(await setBookHidden(owner.id, book.id, true)).toBe(false);
    expect(await setBookHidden(owner.id, book.id, false)).toBe(true);
  });

  it("чужую книгу скрыть нельзя", async () => {
    const owner = await makeMember();
    const stranger = await makeMember();
    const book = await makeBook(owner.id, owner.zoneId, "Чужая книга");
    expect(await setBookHidden(stranger.id, book.id, true)).toBe(false);
  });

  it("скрытая книга не видна гостю и соседу, но видна владельцу", async () => {
    const owner = await makeMember();
    const book = await makeBook(owner.id, owner.zoneId, "Скрытая книга");
    await setBookHidden(owner.id, book.id, true);
    expect(await getBook(book.id, null)).toBeNull();
    expect((await getNeighborBooks(owner.id)).map((item) => item.id)).not.toContain(book.id);
    expect((await getBook(book.id, { id: owner.id, role: "member" }))?.isOwner).toBe(true);
  });

  it("книги заблокированного участника пропадают из каталога", async () => {
    const owner = await makeMember();
    const book = await makeBook(owner.id, owner.zoneId, "Книга нарушителя");
    const db = await getDb();
    await db.update(schema.users).set({ status: "blocked" }).where(eq(schema.users.id, owner.id));
    expect(await getBook(book.id, null)).toBeNull();
    expect((await searchCatalog({ q: "нарушителя" })).books).toEqual([]);
  });

  it("свою книгу «хотеть» нельзя, повторное «Хочу» не дублируется", async () => {
    const owner = await makeMember();
    const reader = await makeMember();
    const book = await makeBook(owner.id, owner.zoneId, "Хотим книгу");
    expect(await recordInterest(owner.id, [book.id])).toBe(0);
    expect(await recordInterest(reader.id, [book.id])).toBe(1);
    await recordInterest(reader.id, [book.id]);
    const db = await getDb();
    const rows = await db.select().from(schema.interests).where(eq(schema.interests.bookId, book.id));
    expect(rows).toHaveLength(1);
  });

  it("в публичной книге нет закрытых полей владельца", async () => {
    const owner = await makeMember();
    await makeBook(owner.id, owner.zoneId, "Публичная книга");
    const { books } = await searchCatalog({});
    const keys = deepKeys(books);
    for (const key of PRIVATE_KEYS) expect(keys.has(key)).toBe(false);
    const text = JSON.stringify(books);
    expect(text).not.toContain(owner.email!);
    expect(text).not.toContain(owner.contact!);
    expect(text).not.toContain(owner.providerUserId);
  });
});
