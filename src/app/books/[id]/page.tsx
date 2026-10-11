import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover, ModeBadge, StatusBadge } from "@/components/book";
import { Button, ButtonLink, Tag } from "@/components/ui";
import { getDemoBook, getNeighborId } from "@/lib/demo-books";
import { CONDITION_HINTS } from "@/lib/dictionaries";

const DATE_FORMAT = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

export async function generateMetadata({ params }: PageProps<"/books/[id]">): Promise<Metadata> {
  const book = getDemoBook((await params).id);
  return book ? { title: book.title } : {};
}

export default async function BookPage({ params }: PageProps<"/books/[id]">) {
  const book = getDemoBook((await params).id);
  if (!book) notFound();

  const neighborId = getNeighborId(book.ownerName);
  const queued = book.status === "reserved" || book.status === "on_loan";

  return (
    <article className="flex flex-col gap-5">
      <Link href="/" className="inline-flex min-h-11 items-center text-[15px] text-ink-soft">
        ← Вся полка
      </Link>

      <div className="mx-auto w-full max-w-xs">
        <BookCover book={book} size="page" />
      </div>

      <div className="flex flex-wrap gap-2">
        <ModeBadge book={book} />
        <StatusBadge book={book} />
      </div>

      <div>
        <h1 className="font-display text-[32px] leading-[1.1] font-semibold">{book.title}</h1>
        {book.author && <p className="mt-1 text-ink-soft">{book.author}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {book.ageGroups.map((group) => (
          <Tag key={group}>{group}</Tag>
        ))}
        {book.category && <Tag>{book.category}</Tag>}
        {book.themes.map((theme) => (
          <Tag key={theme}>{theme}</Tag>
        ))}
      </div>

      {book.note && <p>{book.note}</p>}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[15px]">
        <dt className="text-ink-soft">Состояние</dt>
        <dd>
          {book.condition} — {CONDITION_HINTS[book.condition]}
        </dd>
        <dt className="text-ink-soft">Чья книга</dt>
        <dd>
          {neighborId ? (
            <Link href={`/neighbors/${neighborId}`} className="font-semibold underline underline-offset-2">
              {book.ownerName}
            </Link>
          ) : (
            book.ownerName
          )}{" "}
          · {book.zone}
        </dd>
        <dt className="text-ink-soft">На полке</dt>
        <dd>с {DATE_FORMAT.format(new Date(book.createdAt))}</dd>
      </dl>

      {neighborId && (
        <ButtonLink href={`/neighbors/${neighborId}`} variant="secondary">
          Вся полка соседа — можно взять несколько книг
        </ButtonLink>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="ghost" className="min-h-11 px-0 text-[15px] font-medium">
          Поделиться
        </Button>
        <Button type="button" variant="ghost" className="min-h-11 px-0 text-[15px] font-medium">
          Пожаловаться
        </Button>
      </div>

      <div className="sticky bottom-16 -mx-4 border-t border-line bg-bg px-4 py-3">
        <Button type="button" className="w-full">
          {queued ? "Хочу эту книгу — встать в очередь" : "Хочу эту книгу"}
        </Button>
      </div>
    </article>
  );
}
