// Справочники из PRD, раздел 9. Значения меняет только владелец продукта.
// В базе хранятся коды (`id`), на экране — подписи: подпись можно поменять без миграции.

type Entry<Id extends string> = { readonly id: Id; readonly label: string };

function labels<Id extends string>(entries: readonly Entry<Id>[]) {
  return Object.fromEntries(entries.map((entry) => [entry.id, entry.label])) as Record<Id, string>;
}

export const AGE_GROUPS = [
  { id: "0-2", label: "0–2" },
  { id: "3-4", label: "3–4" },
  { id: "5-6", label: "5–6" },
  { id: "7-9", label: "7–9" },
  { id: "10-12", label: "10–12" },
  { id: "13+", label: "13+" },
  { id: "adult", label: "взрослым" },
] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number]["id"];
export const AGE_LABELS = labels(AGE_GROUPS);

export const CATEGORIES = [
  { id: "tales", label: "Сказки" },
  { id: "poems", label: "Стихи" },
  { id: "stories", label: "Рассказы и повести" },
  { id: "picture", label: "Книжки-картинки и виммельбухи" },
  { id: "science", label: "Познавательные и энциклопедии" },
  { id: "learning", label: "Развивающие: азбуки, прописи, счёт" },
  { id: "novelty", label: "С окошками, наклейками, тактильные" },
  { id: "comics", label: "Комиксы" },
  { id: "school", label: "Школьная программа и внеклассное чтение" },
  { id: "foreign", label: "На иностранном языке" },
  { id: "parents", label: "Для родителей" },
  { id: "other", label: "Другое" },
] as const;
export type Category = (typeof CATEGORIES)[number]["id"];
export const CATEGORY_LABELS = labels(CATEGORIES);

export const THEMES = [
  { id: "fear-dark", label: "Страх темноты" },
  { id: "fears", label: "Другие страхи" },
  { id: "anger", label: "Злость" },
  { id: "sibling", label: "Ревность к брату или сестре" },
  { id: "separation", label: "Разлука и расставание" },
  { id: "adaptation", label: "Адаптация к саду и школе" },
  { id: "anxiety", label: "Тревога" },
  { id: "friendship", label: "Дружба и ссоры" },
  { id: "shyness", label: "Застенчивость" },
  { id: "routine", label: "Сон, еда, горшок" },
  { id: "moving", label: "Переезд" },
  { id: "divorce", label: "Развод" },
  { id: "illness", label: "Болезнь и врачи" },
  { id: "loss", label: "Утрата" },
] as const;
export type Theme = (typeof THEMES)[number]["id"];
export const THEME_LABELS = labels(THEMES);

// Состояние обязательно: по нему сосед понимает, какую книгу получит.
export const CONDITIONS = [
  { id: "new", label: "Как новая", hint: "почти не читали" },
  { id: "good", label: "Хорошее", hint: "читали аккуратно, всё целое" },
  { id: "worn", label: "Потрёпанная", hint: "потёртости, мятые уголки" },
  { id: "flawed", label: "С изъянами", hint: "порваны или разрисованы страницы" },
] as const;
export type Condition = (typeof CONDITIONS)[number]["id"];
export const CONDITION_LABELS = labels(CONDITIONS);
export const CONDITION_HINTS = Object.fromEntries(
  CONDITIONS.map((entry) => [entry.id, entry.hint]),
) as Record<Condition, string>;

export const BOOK_MODES = ["gift", "lend"] as const;
export type BookMode = (typeof BOOK_MODES)[number];
export const MODE_LABELS: Record<BookMode, string> = { gift: "Отдаю", lend: "Даю почитать" };

export const LEND_DAYS = [14, 30, 60] as const;
export type LendDays = (typeof LEND_DAYS)[number];

export const LEND_LABELS: Record<LendDays, string> = {
  14: "на 2 недели",
  30: "на месяц",
  60: "на 2 месяца",
};

export const BOOK_STATUSES = ["available", "reserved", "on_loan", "gone", "hidden", "removed"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

/** Статусы, которые видны в каталоге (PRD, раздел 5). */
export const CATALOG_STATUSES = ["available", "reserved", "on_loan"] as const satisfies BookStatus[];

export const STATUS_LABELS: Record<BookStatus, string> = {
  available: "Свободна",
  reserved: "Обещана",
  on_loan: "На руках",
  gone: "Отдана",
  hidden: "Скрыта",
  removed: "Снята",
};

export function ids<Id extends string>(entries: readonly { id: Id }[]) {
  return entries.map((entry) => entry.id) as [Id, ...Id[]];
}
