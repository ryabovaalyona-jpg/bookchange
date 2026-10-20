"use client";

import { useActionState, useState } from "react";
import { wantBooks } from "@/app/books/actions";
import type { PublicBook } from "@/server/books";
import { BookCard } from "./book";
import { SubmitButton } from "./form";

function booksWord(count: number) {
  if (count === 1) return "эту книгу";
  return `эти книги · ${count}`;
}

/** Полка соседа: можно отметить несколько книг и попросить их одним запросом. */
export function NeighborShelf({ books, back, own }: { books: PublicBook[]; back: string; own: boolean }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [state, action] = useActionState(wantBooks, undefined);

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="back" value={back} />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((book) => {
          const checked = selected.includes(book.id);
          return (
            <li key={book.id} className="flex flex-col gap-2">
              <BookCard book={book} />
              {!own && (
                <label
                  className={`mt-auto flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border px-3 text-[15px] font-medium ${
                    checked ? "border-ink bg-surface-2" : "border-line bg-surface"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="bookId"
                    value={book.id}
                    checked={checked}
                    onChange={() => toggle(book.id)}
                    className="size-5 accent-[var(--accent)]"
                  />
                  {checked ? "Выбрана" : "Выбрать"}
                </label>
              )}
            </li>
          );
        })}
      </ul>

      {!own && (
        <div className="sticky bottom-16 -mx-4 flex flex-col gap-2 border-t border-line bg-bg px-4 py-3">
          {state?.message ? (
            <p role="status" className="py-2 text-center font-medium">
              {state.message}
            </p>
          ) : (
            <>
              {state?.error && (
                <p role="alert" className="text-center text-[15px]">
                  {state.error}
                </p>
              )}
              <SubmitButton className="w-full" disabled={selected.length === 0} pending="Записываем…">
                {selected.length === 0 ? "Отметьте книги, которые хотите" : `Хочу ${booksWord(selected.length)}`}
              </SubmitButton>
            </>
          )}
        </div>
      )}
    </form>
  );
}
