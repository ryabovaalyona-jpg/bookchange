"use server";

import { revalidatePath } from "next/cache";
import type { BookFormState } from "@/components/add-book-form";
import { parseBookForm } from "@/server/book-input";
import { BookError, createBook } from "@/server/book-mutations";
import { booksCreatedToday } from "@/server/books";
import { requireMember } from "@/server/session";

const DAILY_LIMIT = 100;

export async function addBook(_: BookFormState, formData: FormData): Promise<BookFormState> {
  const user = await requireMember("/add");
  if ((await booksCreatedToday(user.id)) >= DAILY_LIMIT) {
    return { error: "За сутки можно выложить до 100 книг. Продолжите завтра." };
  }
  const parsed = parseBookForm(formData);
  if ("error" in parsed) return { error: parsed.error };
  try {
    const id = await createBook(user, parsed.data, parsed.photos);
    revalidatePath("/");
    return { savedId: id, savedAt: Date.now() };
  } catch (error) {
    if (error instanceof BookError) return { error: error.message };
    console.error("addBook failed", error);
    return { error: "Не получилось сохранить. Попробуйте ещё раз." };
  }
}
