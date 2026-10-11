// Справочники из PRD, раздел 9. Значения меняет только владелец продукта.

export const AGE_GROUPS = ["0–2", "3–4", "5–6", "7–9", "10–12", "13+", "взрослым"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export const CATEGORIES = [
  "Сказки",
  "Стихи",
  "Рассказы и повести",
  "Книжки-картинки и виммельбухи",
  "Познавательные и энциклопедии",
  "Развивающие: азбуки, прописи, счёт",
  "С окошками, наклейками, тактильные",
  "Комиксы",
  "Школьная программа и внеклассное чтение",
  "На иностранном языке",
  "Для родителей",
  "Другое",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const THEMES = [
  "Страх темноты",
  "Другие страхи",
  "Злость",
  "Ревность к брату или сестре",
  "Разлука и расставание",
  "Адаптация к саду и школе",
  "Тревога",
  "Дружба и ссоры",
  "Застенчивость",
  "Сон, еда, горшок",
  "Переезд",
  "Развод",
  "Болезнь и врачи",
  "Утрата",
] as const;
export type Theme = (typeof THEMES)[number];

// Состояние обязательно: по нему сосед понимает, какую книгу получит.
export const CONDITIONS = ["Как новая", "Хорошее", "Потрёпанная", "С изъянами"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const CONDITION_HINTS: Record<Condition, string> = {
  "Как новая": "почти не читали",
  "Хорошее": "читали аккуратно, всё целое",
  "Потрёпанная": "потёртости, мятые уголки",
  "С изъянами": "порваны или разрисованы страницы",
};

export type BookMode = "gift" | "lend";
export const LEND_DAYS = [14, 30, 60] as const;
export type LendDays = (typeof LEND_DAYS)[number];

export const LEND_LABELS: Record<LendDays, string> = {
  14: "на 2 недели",
  30: "на месяц",
  60: "на 2 месяца",
};

export type BookStatus = "available" | "reserved" | "on_loan" | "gone" | "hidden" | "removed";

export const STATUS_LABELS: Record<BookStatus, string> = {
  available: "Свободна",
  reserved: "Обещана",
  on_loan: "На руках",
  gone: "Отдана",
  hidden: "Скрыта",
  removed: "Снята",
};
