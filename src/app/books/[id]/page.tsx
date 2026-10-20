import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ageList, BookPhotoCover, ModeBadge, photoSrc, StatusBadge } from "@/components/book";
import { ShareButton } from "@/components/share-button";
import { ButtonLink, Tag } from "@/components/ui";
import { WantButton } from "@/components/want-button";
import { CATEGORY_LABELS, CONDITION_HINTS, CONDITION_LABELS, THEME_LABELS } from "@/lib/dictionaries";
import { appUrl } from "@/server/app-url";
import { getBook } from "@/server/books";
import { getCurrentUser } from "@/server/session";

const DATE_FORMAT = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" });

const load = cache(async (rawId: string) => {
  const viewer = await getCurrentUser();
  const result = await getBook(Number(rawId), viewer);
  return result ? { ...result, viewer } : null;
});

// Ссылка в чате показывает обложку и название (PRD, раздел 6).
export async function generateMetadata({ params }: PageProps<"/books/[id]">): Promise<Metadata> {
  const result = await load((await params).id);
  if (!result) return {};
  const { book } = result;
  const cover = book.photos[0];
  const description = [book.author, ageList(book), book.zone].filter(Boolean).join(" · ");
  return {
    title: book.title,
    description,
    openGraph: {
      title: book.title,
      description,
      type: "book",
      images: cover
        ? [{ url: `${appUrl()}${photoSrc(cover, 800)}`, width: 800, height: Math.round((cover.height * 800) / cover.width) }]
        : undefined,
    },
  };
}

export default async function BookPage({ params }: PageProps<"/books/[id]">) {
  const { id } = await params;
  const result = await load(id);
  if (!result) notFound();
  const { book, isOwner } = result;

  const queued = book.status === "reserved" || book.status === "on_loan";
  const [cover, ...extra] = book.photos;

  return (
    <article className="flex flex-col gap-5">
      <Link href="/" className="inline-flex min-h-11 items-center text-[15px] text-ink-soft">
        ← Вся полка
      </Link>

      <div className="mx-auto w-full max-w-xs">
        <BookPhotoCover book={book} photo={cover} size="page" priority />
      </div>
      {extra.length > 0 && (
        <div className="mx-auto grid w-full max-w-xs grid-cols-2 gap-3">
          {extra.map((photo) => (
            <a key={photo.path} href={photoSrc(photo, 1600)} target="_blank" rel="noreferrer">
              <BookPhotoCover book={book} photo={photo} />
            </a>
          ))}
        </div>
      )}

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
          <Tag key={group}>{ageList({ ageGroups: [group] })}</Tag>
        ))}
        {book.category && <Tag>{CATEGORY_LABELS[book.category]}</Tag>}
        {book.themes.map((theme) => (
          <Tag key={theme}>{THEME_LABELS[theme]}</Tag>
        ))}
      </div>

      {book.note && <p className="whitespace-pre-line">{book.note}</p>}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[15px]">
        <dt className="text-ink-soft">Состояние</dt>
        <dd>
          {CONDITION_LABELS[book.condition]} — {CONDITION_HINTS[book.condition]}
        </dd>
        <dt className="text-ink-soft">Чья книга</dt>
        <dd>
          <Link href={`/neighbors/${book.owner.id}`} className="font-semibold underline underline-offset-2">
            {book.owner.displayName}
          </Link>{" "}
          · {book.zone}
        </dd>
        <dt className="text-ink-soft">На полке</dt>
        <dd>с {DATE_FORMAT.format(new Date(book.createdAt))}</dd>
      </dl>

      {!isOwner && (
        <ButtonLink href={`/neighbors/${book.owner.id}`} variant="secondary">
          Вся полка соседа — можно взять несколько книг
        </ButtonLink>
      )}

      <div className="flex justify-between">
        <ShareButton title={book.title} />
        {!isOwner && (
          <Link
            href={`/books/${book.id}/report`}
            className="inline-flex min-h-11 items-center text-[15px] font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            Пожаловаться
          </Link>
        )}
      </div>

      <div className="sticky bottom-16 -mx-4 border-t border-line bg-bg px-4 py-3">
        {isOwner ? (
          <ButtonLink href={`/books/${book.id}/edit`} variant="secondary" className="w-full">
            Это ваша книга — править
          </ButtonLink>
        ) : (
          <WantButton
            bookId={book.id}
            back={`/books/${book.id}`}
            label={queued ? "Хочу эту книгу — встать в очередь" : "Хочу эту книгу"}
          />
        )}
      </div>
    </article>
  );
}
