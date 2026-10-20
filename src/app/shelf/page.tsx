import type { Metadata } from "next";
import Link from "next/link";
import { BookPhotoCover, ModeBadge } from "@/components/book";
import { ButtonLink, EmptyState, SectionTitle } from "@/components/ui";
import { STATUS_LABELS, type BookStatus } from "@/lib/dictionaries";
import { getOwnBooks, type OwnBook } from "@/server/books";
import { requireMember } from "@/server/session";
import { hideBook, removeOwnBook, showBook } from "./actions";

export const metadata: Metadata = { title: "Моя полка", robots: { index: false } };

const GROUPS: { title: string; statuses: BookStatus[] }[] = [
  { title: "На полке", statuses: ["available", "reserved", "on_loan"] },
  { title: "Скрытые", statuses: ["hidden"] },
  { title: "Сняты модератором", statuses: ["removed"] },
  { title: "Отданы", statuses: ["gone"] },
];

const SMALL_BUTTON =
  "inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line bg-surface px-3 text-[15px] font-medium hover:bg-surface-2";

function ShelfItem({ book }: { book: OwnBook }) {
  return (
    <li className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3">
      <Link href={`/books/${book.id}`} className="w-20 shrink-0">
        <BookPhotoCover book={book} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <Link href={`/books/${book.id}`} className="leading-snug font-semibold underline-offset-2 hover:underline">
            {book.title}
          </Link>
          <p className="text-[13px] text-ink-soft">
            {STATUS_LABELS[book.status]}
            {book.interestCount > 0 && ` · хотят: ${book.interestCount}`}
          </p>
        </div>
        <div>
          <ModeBadge book={book} />
        </div>
        {book.status === "removed" && book.moderationReason && (
          <p className="text-[13px]">Причина: {book.moderationReason}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {book.status !== "removed" && (
            <Link href={`/books/${book.id}/edit`} className={SMALL_BUTTON}>
              Править
            </Link>
          )}
          {book.status === "available" && (
            <form action={hideBook}>
              <input type="hidden" name="bookId" value={book.id} />
              <button className={SMALL_BUTTON}>Скрыть</button>
            </form>
          )}
          {book.status === "hidden" && (
            <form action={showBook}>
              <input type="hidden" name="bookId" value={book.id} />
              <button className={SMALL_BUTTON}>Вернуть на полку</button>
            </form>
          )}
          <details className="w-full">
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-[15px] text-ink-soft underline-offset-4 hover:underline">
              Удалить
            </summary>
            <form action={removeOwnBook} className="flex flex-wrap items-center gap-2 pt-1">
              <input type="hidden" name="bookId" value={book.id} />
              <span className="text-[13px] text-ink-soft">Книга и фото удалятся насовсем.</span>
              <button className={SMALL_BUTTON}>Да, удалить</button>
            </form>
          </details>
        </div>
      </div>
    </li>
  );
}

export default async function ShelfPage() {
  const user = await requireMember("/shelf");
  const books = await getOwnBooks(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-[28px] leading-tight font-semibold">Моя полка</h1>
        <Link href="/profile" className="inline-flex min-h-11 items-center text-[15px] underline underline-offset-2">
          Профиль
        </Link>
      </div>

      {books.length === 0 ? (
        <EmptyState
          title="На полке пока пусто"
          text="Выложите первую книгу — на вторую уйдёт полминуты."
          action={<ButtonLink href="/add">Выложить книгу</ButtonLink>}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/add">Выложить ещё</ButtonLink>
            <ButtonLink href={`/neighbors/${user.id}`} variant="secondary">
              Как видят соседи
            </ButtonLink>
          </div>
          {GROUPS.map((group) => {
            const items = books.filter((book) => group.statuses.includes(book.status));
            if (items.length === 0) return null;
            return (
              <section key={group.title} className="flex flex-col gap-3">
                <SectionTitle>
                  {group.title} · {items.length}
                </SectionTitle>
                <ul className="flex flex-col gap-3">
                  {items.map((book) => (
                    <ShelfItem key={book.id} book={book} />
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
