// Демо-данные для макетов дизайна. Заменяются запросами к базе в фазе 1.
// Зоны здесь условные: настоящий справочник зон даёт владелец (PRD, раздел 15).

import type {
  AgeGroup,
  BookMode,
  BookStatus,
  Category,
  Condition,
  LendDays,
  Theme,
} from "./dictionaries";

export type DemoBook = {
  id: string;
  title: string;
  author?: string;
  ageGroups: AgeGroup[];
  category?: Category;
  themes: Theme[];
  condition: Condition;
  mode: BookMode;
  lendDays?: LendDays;
  note?: string;
  status: BookStatus;
  ownerName: string;
  zone: string;
  createdAt: string;
  /** Тон заглушки обложки, пока нет фото. */
  tone: number;
};

export const DEMO_BOOKS: DemoBook[] = [
  {
    id: "1",
    title: "Крошка Енот и тот, кто сидит в пруду",
    author: "Лилиан Муур",
    ageGroups: ["3–4", "5–6"],
    category: "Сказки",
    themes: ["Другие страхи"],
    condition: "Хорошее",
    mode: "gift",
    note: "Читали каждый вечер целый год, уголки немного потёрты.",
    status: "available",
    ownerName: "Марина",
    zone: "У набережной",
    createdAt: "2026-10-04",
    tone: 0,
  },
  {
    id: "2",
    title: "Вафельное сердце",
    author: "Мария Парр",
    ageGroups: ["7–9", "10–12"],
    category: "Рассказы и повести",
    themes: ["Дружба и ссоры", "Утрата"],
    condition: "Как новая",
    mode: "lend",
    lendDays: 30,
    status: "available",
    ownerName: "Ольга",
    zone: "У парка",
    createdAt: "2026-10-04",
    tone: 1,
  },
  {
    id: "3",
    title: "Городок",
    author: "Ротраут Сузанна Бернер",
    ageGroups: ["0–2", "3–4"],
    category: "Книжки-картинки и виммельбухи",
    themes: [],
    condition: "Потрёпанная",
    mode: "gift",
    status: "reserved",
    ownerName: "Катя",
    zone: "У метро",
    createdAt: "2026-10-03",
    tone: 2,
  },
  {
    id: "4",
    title: "Денискины рассказы",
    author: "Виктор Драгунский",
    ageGroups: ["7–9"],
    category: "Школьная программа и внеклассное чтение",
    themes: [],
    condition: "Хорошее",
    mode: "gift",
    status: "available",
    ownerName: "Анна",
    zone: "У набережной",
    createdAt: "2026-10-03",
    tone: 3,
  },
  {
    id: "5",
    title: "Петсон и Финдус. Именинный пирог",
    author: "Свен Нурдквист",
    ageGroups: ["3–4", "5–6"],
    category: "Сказки",
    themes: [],
    condition: "Как новая",
    mode: "lend",
    lendDays: 14,
    status: "on_loan",
    ownerName: "Ирина",
    zone: "У парка",
    createdAt: "2026-10-02",
    tone: 4,
  },
  {
    id: "6",
    title: "Азбука",
    author: "Самуил Маршак",
    ageGroups: ["5–6"],
    category: "Развивающие: азбуки, прописи, счёт",
    themes: [],
    condition: "Хорошее",
    mode: "gift",
    status: "available",
    ownerName: "Марина",
    zone: "У набережной",
    createdAt: "2026-10-02",
    tone: 5,
  },
  {
    id: "7",
    title: "Муми-тролль и комета",
    author: "Туве Янссон",
    ageGroups: ["5–6", "7–9"],
    category: "Сказки",
    themes: ["Тревога"],
    condition: "Хорошее",
    mode: "gift",
    status: "available",
    ownerName: "Света",
    zone: "У метро",
    createdAt: "2026-10-01",
    tone: 1,
  },
  {
    id: "8",
    title: "Цветик-семицветик",
    author: "Валентин Катаев",
    ageGroups: ["5–6", "7–9"],
    category: "Сказки",
    themes: ["Дружба и ссоры"],
    condition: "С изъянами",
    note: "На двух страницах рисунки фломастером, текст читается.",
    mode: "gift",
    status: "available",
    ownerName: "Ольга",
    zone: "У парка",
    createdAt: "2026-10-01",
    tone: 3,
  },
  {
    id: "9",
    title: "Как говорить, чтобы дети слушали",
    author: "Адель Фабер, Элейн Мазлиш",
    ageGroups: ["взрослым"],
    category: "Для родителей",
    themes: [],
    condition: "Хорошее",
    mode: "lend",
    lendDays: 60,
    status: "available",
    ownerName: "Анна",
    zone: "У набережной",
    createdAt: "2026-09-30",
    tone: 0,
  },
  {
    id: "10",
    title: "Зайчонок, который не хотел спать",
    ageGroups: ["0–2", "3–4"],
    category: "Книжки-картинки и виммельбухи",
    themes: ["Сон, еда, горшок", "Страх темноты"],
    condition: "Как новая",
    mode: "gift",
    status: "available",
    ownerName: "Катя",
    zone: "У метро",
    createdAt: "2026-09-30",
    tone: 4,
  },
  {
    id: "11",
    title: "Мой первый день в детском саду",
    ageGroups: ["3–4"],
    category: "С окошками, наклейками, тактильные",
    themes: ["Адаптация к саду и школе", "Разлука и расставание"],
    condition: "Хорошее",
    mode: "gift",
    status: "available",
    ownerName: "Ирина",
    zone: "У парка",
    createdAt: "2026-09-29",
    tone: 2,
  },
  {
    id: "12",
    title: "Стихи для самых маленьких",
    author: "Агния Барто",
    ageGroups: ["0–2"],
    category: "Стихи",
    themes: [],
    condition: "Потрёпанная",
    mode: "gift",
    status: "available",
    ownerName: "Света",
    zone: "У метро",
    createdAt: "2026-09-29",
    tone: 5,
  },
];

// Демо-соседи: у каждого своя полка. Контактов здесь нет и быть не должно.
export const DEMO_NEIGHBORS = [
  { id: "marina", name: "Марина", zone: "У набережной" },
  { id: "olga", name: "Ольга", zone: "У парка" },
  { id: "katya", name: "Катя", zone: "У метро" },
  { id: "anna", name: "Анна", zone: "У набережной" },
  { id: "irina", name: "Ирина", zone: "У парка" },
  { id: "sveta", name: "Света", zone: "У метро" },
];

export function getDemoNeighbor(id: string) {
  return DEMO_NEIGHBORS.find((neighbor) => neighbor.id === id);
}

export function getNeighborId(name: string) {
  return DEMO_NEIGHBORS.find((neighbor) => neighbor.name === name)?.id;
}

export function getNeighborBooks(name: string) {
  return DEMO_BOOKS.filter((book) => book.ownerName === name);
}

export function getDemoBook(id: string) {
  return DEMO_BOOKS.find((book) => book.id === id);
}
