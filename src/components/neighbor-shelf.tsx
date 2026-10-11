"use client";

import { useState } from "react";
import type { DemoBook } from "@/lib/demo-books";
import { BookCard } from "./book";
import { Button } from "./ui";

function booksWord(count: number) {
  if (count === 1) return "эту книгу";
  return `эти книги · ${count}`;
}

/** Полка соседа: можно отметить несколько книг и попросить их одним запросом. */
export function NeighborShelf({ books }: { books: DemoBook[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  function toggle(id: string) {
    setSent(false);
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((book) => {
          const checked = selected.includes(book.id);
          return (
            <li key={book.id} className="flex flex-col gap-2">
              <BookCard book={book} />
              <label
                className={`mt-auto flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border px-3 text-[15px] font-medium ${
                  checked ? "border-ink bg-surface-2" : "border-line bg-surface"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(book.id)}
                  className="size-5 accent-[var(--accent)]"
                />
                {checked ? "Выбрана" : "Выбрать"}
              </label>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-16 -mx-4 flex flex-col gap-2 border-t border-line bg-bg px-4 py-3">
        {sent ? (
          <p role="status" className="py-2 text-center font-medium">
            Запросы откроются скоро, мы напишем.
          </p>
        ) : (
          <Button
            type="button"
            className="w-full"
            disabled={selected.length === 0}
            onClick={() => setSent(true)}
          >
            {selected.length === 0 ? "Отметьте книги, которые хотите" : `Хочу ${booksWord(selected.length)}`}
          </Button>
        )}
      </div>
    </div>
  );
}
