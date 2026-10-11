import Link from "next/link";
import { LEND_LABELS, STATUS_LABELS } from "@/lib/dictionaries";
import type { DemoBook } from "@/lib/demo-books";
import { Badge } from "./ui";

/** Заглушка обложки. С появлением фото заменяется на <img> с тремя размерами WebP. */
export function BookCover({ book, size = "card" }: { book: DemoBook; size?: "card" | "page" }) {
  return (
    <div
      className={`cover-tone-${book.tone} flex aspect-[3/4] w-full flex-col justify-between overflow-hidden rounded-[var(--radius-card)] ${
        size === "page" ? "p-6" : "p-3"
      }`}
    >
      <p
        className={`font-display leading-[1.05] font-semibold ${
          size === "page" ? "text-4xl" : "text-xl"
        }`}
      >
        {book.title}
      </p>
      {book.author && (
        <p className={size === "page" ? "text-base" : "text-xs"}>{book.author}</p>
      )}
    </div>
  );
}

export function ModeBadge({ book }: { book: DemoBook }) {
  if (book.mode === "lend") {
    return (
      <Badge tone="outline">
        Даю почитать{book.lendDays ? ` ${LEND_LABELS[book.lendDays]}` : ""}
      </Badge>
    );
  }
  return <Badge tone="accent">Отдаю</Badge>;
}

export function StatusBadge({ book }: { book: DemoBook }) {
  if (book.status === "available") return null;
  return <Badge>{STATUS_LABELS[book.status]}</Badge>;
}

export function BookCard({ book }: { book: DemoBook }) {
  return (
    <Link href={`/books/${book.id}`} className="group flex flex-col gap-2">
      <div className="relative">
        <BookCover book={book} />
        <div className="absolute right-2 bottom-2 left-2 flex flex-wrap justify-end gap-1">
          <StatusBadge book={book} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div>
          {book.mode === "lend" ? <Badge tone="outline">Даю почитать</Badge> : <Badge tone="accent">Отдаю</Badge>}
        </div>
        <p className="line-clamp-2 text-[15px] leading-snug font-semibold underline-offset-2 group-hover:underline">
          {book.title}
        </p>
        <p className="text-[13px] text-ink-soft">
          {book.ageGroups.join(", ")} · {book.zone}
        </p>
        <p className="text-[13px] text-ink-soft">{book.condition}</p>
      </div>
    </Link>
  );
}

export function BookGrid({ books }: { books: DemoBook[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {books.map((book) => (
        <li key={book.id}>
          <BookCard book={book} />
        </li>
      ))}
    </ul>
  );
}
