import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddBookForm } from "@/components/add-book-form";
import { photoSrc } from "@/components/book";
import { getBook } from "@/server/books";
import { requireMember } from "@/server/session";
import { saveBook } from "./actions";

export const metadata: Metadata = { title: "Править книгу", robots: { index: false } };

export default async function EditBookPage({ params }: PageProps<"/books/[id]/edit">) {
  const { id } = await params;
  const user = await requireMember(`/books/${id}/edit`);
  const result = await getBook(Number(id), user);
  if (!result || !result.isOwner || result.book.status === "removed") notFound();
  const { book } = result;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/shelf" className="inline-flex min-h-11 items-center text-[15px] text-ink-soft">
        ← Моя полка
      </Link>
      <h1 className="font-display text-[28px] leading-tight font-semibold">Править книгу</h1>
      <AddBookForm
        action={saveBook.bind(null, book.id)}
        editing
        defaults={{ ...book, photoUrls: book.photos.map((photo) => photoSrc(photo, 320)) }}
      />
    </div>
  );
}
