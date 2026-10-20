import "server-only";

import { z } from "zod";
import {
  AGE_GROUPS,
  BOOK_MODES,
  CATEGORIES,
  CONDITIONS,
  ids,
  LEND_DAYS,
  THEMES,
} from "@/lib/dictionaries";
import { MAX_PHOTO_BYTES, MAX_PHOTOS } from "./photos";

// Проверка полей книги из формы (PRD, раздел 6). Одна схема для добавления и правки.

const bookSchema = z
  .object({
    title: z.string().trim().min(1, "Укажите название").max(200, "Название — до 200 знаков"),
    author: z.string().trim().max(200, "Автор — до 200 знаков").optional(),
    ageGroups: z.array(z.enum(ids(AGE_GROUPS))).min(1, "Выберите возраст"),
    category: z.union([z.literal(""), z.enum(ids(CATEGORIES))]).optional(),
    themes: z.array(z.enum(ids(THEMES))).max(THEMES.length),
    condition: z.enum(ids(CONDITIONS), { error: "Выберите состояние" }),
    mode: z.enum(BOOK_MODES).default("gift"),
    lendDays: z.coerce.number().optional(),
    note: z.string().trim().max(300, "Комментарий — до 300 знаков").optional(),
    catalogId: z
      .string()
      .regex(/^\d{1,12}$/)
      .optional()
      .or(z.literal("")),
  })
  .transform((data, ctx) => {
    let lendDays: number | null = null;
    if (data.mode === "lend") {
      lendDays = data.lendDays ?? 30;
      if (!(LEND_DAYS as readonly number[]).includes(lendDays)) {
        ctx.addIssue({ code: "custom", message: "Выберите срок" });
        return z.NEVER;
      }
    }
    return {
      title: data.title,
      author: data.author || null,
      ageGroups: [...new Set(data.ageGroups)],
      category: data.category || null,
      themes: [...new Set(data.themes)],
      condition: data.condition,
      mode: data.mode,
      lendDays,
      note: data.note || null,
      catalogId: data.catalogId ? Number(data.catalogId) : null,
    };
  });

export type BookInput = z.output<typeof bookSchema>;

export function parseBookForm(formData: FormData) {
  const parsed = bookSchema.safeParse({
    title: formData.get("title") ?? "",
    author: formData.get("author") ?? undefined,
    ageGroups: formData.getAll("ageGroups"),
    category: formData.get("category") ?? undefined,
    themes: formData.getAll("themes"),
    condition: formData.get("condition") ?? undefined,
    mode: formData.get("mode") ?? undefined,
    lendDays: formData.get("lendDays") || undefined,
    note: formData.get("note") ?? undefined,
    catalogId: formData.get("catalogId") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;

  const photos = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File && item.size > 0);
  if (photos.some((photo) => photo.size > MAX_PHOTO_BYTES)) return { error: "Фото больше 10 МБ" } as const;
  const total = photos.length + (parsed.data.catalogId ? 1 : 0);
  if (total > MAX_PHOTOS) return { error: "Не больше трёх фото" } as const;

  return { data: parsed.data, photos } as const;
}
