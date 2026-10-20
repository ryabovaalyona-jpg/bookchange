"use server";

import { revalidatePath } from "next/cache";
import type { BookFormState } from "@/components/add-book-form";
import { parseBookForm } from "@/server/book-input";
import { BookError, updateBook } from "@/server/book-mutations";
import { requireMember } from "@/server/session";

export async function saveBook(bookId: number, _: BookFormState, formData: FormData): Promise<BookFormState> {
  const owner = await requireMember(`/books/${bookId}/edit`);
  const parsed = parseBookForm(formData);
  if ("error" in parsed) return { error: parsed.error };
  try {
    await updateBook(owner.id, bookId, parsed.data, parsed.photos);
  } catch (error) {
    if (error instanceof BookError) return { error: error.message };
    console.error("updateBook failed", error);
    return { error: "Не получилось сохранить. Попробуйте ещё раз." };
  }
  revalidatePath(`/books/${bookId}`);
  return { savedId: bookId, savedAt: Date.now() };
}
