import Link from "next/link";
import { ADMIN_BUTTON, ADMIN_INPUT, DATE_TIME } from "@/components/admin-ui";
import { STATUS_LABELS } from "@/lib/dictionaries";
import { adminBooks } from "@/server/admin";
import { moderateBookAction } from "../actions";

export default async function AdminBooksPage({ searchParams }: PageProps<"/admin/books">) {
  const q = String((await searchParams).q ?? "");
  const rows = await adminBooks(q);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[28px] leading-tight font-semibold">Книги</h1>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Название или автор" className={`${ADMIN_INPUT} flex-1`} />
        <button className={ADMIN_BUTTON}>Найти</button>
      </form>
      <ul className="flex flex-col gap-3">
        {rows.map((book) => (
          <li key={book.id} className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-3">
            <div>
              <Link href={`/books/${book.id}`} className="font-semibold underline underline-offset-2">
                {book.title}
              </Link>
              <p className="text-[13px] text-ink-soft">
                #{book.id} · {STATUS_LABELS[book.status]} · {book.owner ?? "—"} · {DATE_TIME.format(book.createdAt)}
              </p>
              {book.moderationReason && <p className="text-[13px]">Причина: {book.moderationReason}</p>}
            </div>
            <form action={moderateBookAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="bookId" value={book.id} />
              {book.status !== "removed" && (
                <>
                  {book.status !== "hidden" && (
                    <button name="action" value="hide" className={ADMIN_BUTTON}>
                      Скрыть
                    </button>
                  )}
                  <input name="reason" placeholder="Причина снятия" maxLength={300} className={`${ADMIN_INPUT} min-w-0 flex-1`} />
                  <button name="action" value="remove" className={ADMIN_BUTTON}>
                    Снять
                  </button>
                </>
              )}
              {(book.status === "removed" || book.status === "hidden") && (
                <button name="action" value="restore" className={ADMIN_BUTTON}>
                  Вернуть на полку
                </button>
              )}
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
