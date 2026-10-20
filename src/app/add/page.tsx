import type { Metadata } from "next";
import { AddBookForm } from "@/components/add-book-form";
import { lastBookDefaults } from "@/server/books";
import { requireMember } from "@/server/session";
import { addBook } from "./actions";

export const metadata: Metadata = { title: "Выложить книгу", robots: { index: false } };

export default async function AddBookPage() {
  const user = await requireMember("/add");
  const defaults = await lastBookDefaults(user.id);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[28px] leading-tight font-semibold">Выложить книгу</h1>
      <AddBookForm action={addBook} defaults={defaults ?? undefined} />
    </div>
  );
}
