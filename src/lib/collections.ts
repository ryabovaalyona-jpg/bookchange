// Быстрые подборки — сохранённые фильтры (PRD, раздел 9).

import type { DemoBook } from "./demo-books";

export type QuickCollection = {
  id: string;
  label: string;
  match: (book: DemoBook) => boolean;
};

export const QUICK_COLLECTIONS: QuickCollection[] = [
  { id: "feelings", label: "Про чувства", match: (b) => b.themes.length > 0 },
  { id: "tales", label: "Сказки", match: (b) => b.category === "Сказки" },
  { id: "babies", label: "Малышам 0–2", match: (b) => b.ageGroups.includes("0–2") },
  {
    id: "preschool",
    label: "Перед школой",
    match: (b) =>
      b.ageGroups.includes("5–6") && b.category === "Развивающие: азбуки, прописи, счёт",
  },
  { id: "readers", label: "Читаем сами 7–9", match: (b) => b.ageGroups.includes("7–9") },
  {
    id: "pictures",
    label: "Картинки и виммельбухи",
    match: (b) => b.category === "Книжки-картинки и виммельбухи",
  },
  { id: "parents", label: "Для родителей", match: (b) => b.category === "Для родителей" },
];
