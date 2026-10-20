"use server";

import { z } from "zod";
import { recordInterest } from "@/server/book-mutations";
import { allow } from "@/server/rate-limit";
import { requireMember, safeNext } from "@/server/session";

export type WantState = { message?: string; error?: string } | undefined;

/** «Хочу эту книгу» и «Хочу эти книги»: в фазе 1 только записывает интерес. */
export async function wantBooks(_: WantState, formData: FormData): Promise<WantState> {
  const back = safeNext(formData.get("back"));
  const user = await requireMember(back);
  const ids = z.array(z.coerce.number().int().positive()).max(50).safeParse(formData.getAll("bookId"));
  if (!ids.success || ids.data.length === 0) return { error: "Отметьте книги" };
  if (!allow(`want:${user.id}`, 60, 60 * 60 * 1000)) return { error: "Слишком часто. Попробуйте позже." };
  const recorded = await recordInterest(user.id, ids.data);
  if (recorded === 0) return { error: "Эту книгу попросить нельзя." };
  return { message: "Запросы откроются скоро, мы напишем." };
}
