// Быстрые подборки — сохранённые фильтры (PRD, раздел 9).

import type { AgeGroup, Category } from "./dictionaries";

export type CollectionFilter = {
  /** Любая тема «про чувства». */
  anyTheme?: boolean;
  category?: Category;
  age?: AgeGroup;
};

export type QuickCollection = { id: string; label: string; filter: CollectionFilter };

export const QUICK_COLLECTIONS: QuickCollection[] = [
  { id: "feelings", label: "Про чувства", filter: { anyTheme: true } },
  { id: "tales", label: "Сказки", filter: { category: "tales" } },
  { id: "babies", label: "Малышам 0–2", filter: { age: "0-2" } },
  { id: "preschool", label: "Перед школой", filter: { age: "5-6", category: "learning" } },
  { id: "readers", label: "Читаем сами 7–9", filter: { age: "7-9" } },
  { id: "pictures", label: "Картинки и виммельбухи", filter: { category: "picture" } },
  { id: "parents", label: "Для родителей", filter: { category: "parents" } },
];
