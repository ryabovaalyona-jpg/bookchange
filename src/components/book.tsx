import Link from "next/link";
import { AGE_LABELS, CONDITION_LABELS, LEND_LABELS, STATUS_LABELS } from "@/lib/dictionaries";
import type { BookPhoto, PublicBook } from "@/server/books";
import { Badge } from "./ui";

/** Адрес фото нужного размера. Совпадает с `photoUrl` на сервере. */
export function photoSrc(photo: BookPhoto, width: 320 | 800 | 1600 = 800) {
  return `/media/${photo.path}-${width}.webp`;
}

/** Обложка в едином формате 3:4. Без картинки — цветная заглушка с названием. */
export function BookCover({
  title,
  author,
  src,
  srcSet,
  sizes,
  size = "card",
  priority = false,
}: {
  title: string;
  author?: string | null;
  src?: string;
  srcSet?: string;
  sizes?: string;
  size?: "card" | "page";
  priority?: boolean;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- размеры WebP готовит сервер при загрузке
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={`Обложка: ${title}`}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className="aspect-[3/4] w-full rounded-[var(--radius-card)] bg-surface-2 object-cover"
      />
    );
  }
  const tone = [...title].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6;
  return (
    <div
      className={`cover-tone-${tone} flex aspect-[3/4] w-full flex-col justify-between overflow-hidden rounded-[var(--radius-card)] ${
        size === "page" ? "p-6" : "p-3"
      }`}
    >
      <p className={`font-display leading-[1.05] font-semibold ${size === "page" ? "text-4xl" : "text-xl"}`}>
        {title}
      </p>
      {author && <p className={size === "page" ? "text-base" : "text-xs"}>{author}</p>}
    </div>
  );
}

export function BookPhotoCover({
  book,
  photo = book.photos[0],
  size = "card",
  priority = false,
}: {
  book: Pick<PublicBook, "title" | "author" | "photos">;
  photo?: BookPhoto;
  size?: "card" | "page";
  priority?: boolean;
}) {
  return (
    <BookCover
      title={book.title}
      author={book.author}
      size={size}
      priority={priority}
      src={photo ? photoSrc(photo, size === "page" ? 800 : 320) : undefined}
      srcSet={
        photo
          ? `${photoSrc(photo, 320)} 320w, ${photoSrc(photo, 800)} 800w, ${photoSrc(photo, 1600)} 1600w`
          : undefined
      }
      sizes={size === "page" ? "(max-width: 480px) 90vw, 320px" : "(max-width: 640px) 45vw, 200px"}
    />
  );
}

export function ModeBadge({ book }: { book: Pick<PublicBook, "mode" | "lendDays"> }) {
  if (book.mode === "lend") {
    return (
      <Badge tone="outline">Даю почитать{book.lendDays ? ` ${LEND_LABELS[book.lendDays]}` : ""}</Badge>
    );
  }
  return <Badge tone="accent">Отдаю</Badge>;
}

export function StatusBadge({ book }: { book: Pick<PublicBook, "status"> }) {
  if (book.status === "available") return null;
  return <Badge>{STATUS_LABELS[book.status]}</Badge>;
}

export function ageList(book: Pick<PublicBook, "ageGroups">) {
  return book.ageGroups.map((group) => AGE_LABELS[group]).join(", ");
}

export function BookCard({ book, priority = false }: { book: PublicBook; priority?: boolean }) {
  return (
    <Link href={`/books/${book.id}`} className="group flex flex-col gap-2">
      <div className="relative">
        <BookPhotoCover book={book} priority={priority} />
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
          {ageList(book)} · {book.zone}
        </p>
        <p className="text-[13px] text-ink-soft">{CONDITION_LABELS[book.condition]}</p>
      </div>
    </Link>
  );
}

export function BookGrid({ books }: { books: PublicBook[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {books.map((book, index) => (
        <li key={book.id}>
          <BookCard book={book} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
