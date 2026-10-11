// Варианты стиля на выбор владельца (PRD, раздел 10). После выбора остаётся один,
// а переключатель и cookie удаляются.

import { cookies } from "next/headers";

export const STYLE_VARIANTS = [
  { id: "duo", label: "Двойной", hint: "тёмная шапка, светлая полка" },
  { id: "paper", label: "Бумага", hint: "всё светлое" },
  { id: "night", label: "Ночь", hint: "как сайт ANIMI" },
] as const;

export type StyleVariant = (typeof STYLE_VARIANTS)[number]["id"];

export const STYLE_COOKIE = "style";

export async function getStyleVariant(): Promise<StyleVariant> {
  const value = (await cookies()).get(STYLE_COOKIE)?.value;
  return STYLE_VARIANTS.some((v) => v.id === value) ? (value as StyleVariant) : "duo";
}
