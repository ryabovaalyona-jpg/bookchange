// Подсказки книг по названию. Единственное место, которое знает про внешний каталог:
// сменить источник — значит переписать только этот файл.
// Наружу уходит только текст запроса, без данных участника.
// Источник сейчас — поиск сайта ЛитРес, без договора; риски — в docs/covers.md.

import type { AgeGroup } from "./dictionaries";

const SEARCH_URL = "https://api.litres.ru/foundation/api/search";
const COVER_ORIGIN = "https://www.litres.ru";
const TIMEOUT_MS = 5000;

export type BookSuggestion = {
  sourceId: number;
  title: string;
  author: string;
  ageGroup: AgeGroup | null;
  /** Обложка отдаётся через наш сервер, см. api/book-lookup/cover. */
  coverUrl: string;
};

type LitresPerson = { full_name: string; role: string };
type LitresItem = {
  instance: {
    id: number;
    title: string;
    min_age: number | null;
    cover_url: string | null;
    is_adult_content?: boolean;
    persons?: LitresPerson[];
  };
};

function toAgeGroup(minAge: number | null): AgeGroup | null {
  if (minAge === null || minAge > 12) return null;
  if (minAge <= 2) return null; // «0+» у ЛитРес — отметка «без ограничений», а не возраст читателя
  if (minAge <= 4) return "3-4";
  if (minAge <= 6) return "5-6";
  if (minAge <= 9) return "7-9";
  return "10-12";
}

export function coverProxyUrl(sourceId: number) {
  return `/api/book-lookup/cover?id=${sourceId}`;
}

export function coverSourceUrl(sourceId: number) {
  return `${COVER_ORIGIN}/pub/c/cover/${sourceId}.jpg`;
}

export async function lookupBooks(query: string): Promise<BookSuggestion[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set("types", "text_book");

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return [];
    const body = (await response.json()) as { payload?: { data?: LitresItem[] } };
    return (body.payload?.data ?? [])
      .map((item) => item.instance)
      .filter((book) => book.cover_url && !book.is_adult_content && (book.min_age ?? 0) < 16)
      .map((book) => ({
        sourceId: book.id,
        title: book.title,
        author: (book.persons ?? [])
          .filter((person) => person.role === "author")
          .map((person) => person.full_name)
          .join(", "),
        ageGroup: toAgeGroup(book.min_age),
        coverUrl: coverProxyUrl(book.id),
      }));
  } catch {
    // Каталог недоступен — участник просто сфотографирует обложку.
    return [];
  }
}

/** Скачивает обложку из каталога, чтобы сохранить её у себя вместе с книгой. */
export async function fetchCatalogCover(sourceId: number): Promise<Buffer | null> {
  if (!Number.isSafeInteger(sourceId) || sourceId <= 0) return null;
  try {
    const response = await fetch(coverSourceUrl(sourceId), { signal: AbortSignal.timeout(8000) });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/")) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}
