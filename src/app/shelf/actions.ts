"use server";

import { revalidatePath } from "next/cache";
import { deleteBook, setBookHidden } from "@/server/book-mutations";
import { requireMember } from "@/server/session";

function bookId(formData: FormData) {
  const id = Number(formData.get("bookId"));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function hideBook(formData: FormData) {
  const user = await requireMember("/shelf");
  const id = bookId(formData);
  if (id) await setBookHidden(user.id, id, true);
  revalidatePath("/shelf");
}

export async function showBook(formData: FormData) {
  const user = await requireMember("/shelf");
  const id = bookId(formData);
  if (id) await setBookHidden(user.id, id, false);
  revalidatePath("/shelf");
}

export async function removeOwnBook(formData: FormData) {
  const user = await requireMember("/shelf");
  const id = bookId(formData);
  if (id) await deleteBook(user.id, id);
  revalidatePath("/shelf");
}
