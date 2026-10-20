import { beforeAll, describe, expect, it } from "vitest";
import { searchCatalog } from "@/server/books";
import { makeBook, makeMember } from "./helpers";

// Поиск по названию и автору прощает опечатки (PRD, раздел 6).
describe("поиск в каталоге", () => {
  beforeAll(async () => {
    const owner = await makeMember("Ольга");
    await makeBook(owner.id, owner.zoneId, "Вафельное сердце", "Мария Парр");
    await makeBook(owner.id, owner.zoneId, "Денискины рассказы", "Виктор Драгунский");
    await makeBook(owner.id, owner.zoneId, "Муми-тролль и комета", "Туве Янссон");
    await makeBook(owner.id, owner.zoneId, "Крошка Енот и тот, кто сидит в пруду", "Лилиан Муур");
  });

  const titles = async (q: string) => (await searchCatalog({ q })).books.map((book) => book.title);

  it.each([
    ["вафельное сердце", "Вафельное сердце"],
    ["вафелное серце", "Вафельное сердце"],
    ["денискины расказы", "Денискины рассказы"],
    ["драгунски", "Денискины рассказы"],
    ["рассказ", "Денискины рассказы"],
    ["мумитроль", "Муми-тролль и комета"],
    ["янсон", "Муми-тролль и комета"],
    ["крошка енод", "Крошка Енот и тот, кто сидит в пруду"],
  ])("«%s» находит «%s»", async (q, expected) => {
    expect((await titles(q))[0]).toBe(expected);
  });

  it("не находит лишнего", async () => {
    expect(await titles("энциклопедия динозавров")).toEqual([]);
  });
});
