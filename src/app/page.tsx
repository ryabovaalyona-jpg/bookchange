import { BookGrid } from "@/components/book";
import { ButtonLink, Chip, EmptyState } from "@/components/ui";
import { QUICK_COLLECTIONS } from "@/lib/collections";
import { DEMO_BOOKS } from "@/lib/demo-books";
import { AGE_GROUPS } from "@/lib/dictionaries";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function hrefWith(current: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default async function CatalogPage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const q = first(sp.q)?.trim() ?? "";
  const c = first(sp.c);
  const age = first(sp.age);
  const current = { q: q || undefined, c, age };

  const collection = QUICK_COLLECTIONS.find((item) => item.id === c);
  const needle = q.toLowerCase();
  const books = DEMO_BOOKS.filter(
    (book) =>
      (!collection || collection.match(book)) &&
      (!age || book.ageGroups.some((group) => group === age)) &&
      (!needle ||
        book.title.toLowerCase().includes(needle) ||
        book.author?.toLowerCase().includes(needle)),
  );
  const filtered = Boolean(q || c || age);

  return (
    <div className="flex flex-col gap-5">
      <form action="/" role="search">
        {c && <input type="hidden" name="c" value={c} />}
        {age && <input type="hidden" name="age" value={age} />}
        <label htmlFor="q" className="sr-only">
          Поиск по названию и автору
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Название или автор"
          className="h-12 w-full rounded-[var(--radius-control)] border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-soft"
        />
      </form>

      <section aria-label="Быстрые подборки" className="-mx-4">
        <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar">
          {QUICK_COLLECTIONS.map((item) => (
            <Chip
              key={item.id}
              href={hrefWith(current, { c: item.id === c ? undefined : item.id })}
              active={item.id === c}
            >
              {item.label}
            </Chip>
          ))}
        </div>
      </section>

      <section aria-label="Возраст" className="-mx-4">
        <div className="flex items-center gap-2 overflow-x-auto px-4 no-scrollbar">
          <span className="shrink-0 text-sm text-ink-soft">Возраст</span>
          {AGE_GROUPS.map((group) => (
            <Chip
              key={group}
              href={hrefWith(current, { age: group === age ? undefined : group })}
              active={group === age}
            >
              {group}
            </Chip>
          ))}
        </div>
      </section>

      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-[28px] leading-tight font-semibold">
          {collection ? collection.label : "Новые на полке"}
        </h1>
        <p className="text-sm text-ink-soft">{books.length} кн.</p>
      </div>

      {books.length > 0 ? (
        <BookGrid books={books} />
      ) : (
        <EmptyState
          title={filtered ? "Таких книг пока нет" : "На полке пока пусто"}
          text={
            filtered
              ? "Попробуйте убрать часть фильтров."
              : "Выложите первую книгу — соседи увидят её сразу."
          }
          action={
            filtered ? (
              <ButtonLink href="/" variant="secondary">
                Показать все книги
              </ButtonLink>
            ) : (
              <ButtonLink href="/add">Выложить книгу</ButtonLink>
            )
          }
        />
      )}
    </div>
  );
}
