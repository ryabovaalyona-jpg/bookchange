import { BookGrid } from "@/components/book";
import { ButtonLink, Chip, EmptyState } from "@/components/ui";
import { QUICK_COLLECTIONS } from "@/lib/collections";
import {
  AGE_GROUPS,
  CATEGORIES,
  MODE_LABELS,
  THEMES,
  type AgeGroup,
  type BookMode,
  type Category,
  type Theme,
} from "@/lib/dictionaries";
import { searchCatalog } from "@/server/books";
import { getActiveZones } from "@/server/zones";

const SELECT =
  "h-12 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base text-ink";

type Params = Record<string, string | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pickId<T extends string>(value: string | undefined, entries: readonly { id: T }[]) {
  return entries.find((entry) => entry.id === value)?.id;
}

function hrefWith(current: Params, patch: Params) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch, page: patch.page })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default async function CatalogPage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const q = first(sp.q)?.trim().slice(0, 100) ?? "";
  const collection = QUICK_COLLECTIONS.find((item) => item.id === first(sp.c));
  const age = pickId<AgeGroup>(first(sp.age), AGE_GROUPS);
  const category = pickId<Category>(first(sp.cat), CATEGORIES);
  const theme = pickId<Theme>(first(sp.theme), THEMES);
  const mode = (["gift", "lend"] as const).find((item) => item === first(sp.mode)) as BookMode | undefined;
  const zones = await getActiveZones();
  const zone = zones.find((item) => String(item.id) === first(sp.zone));
  const page = Math.min(Math.max(Number(first(sp.page)) || 0, 0), 100);

  const current: Params = {
    q: q || undefined,
    c: collection?.id,
    age,
    cat: category,
    theme,
    mode,
    zone: zone ? String(zone.id) : undefined,
  };

  const { books, hasMore } = await searchCatalog(
    {
      ...collection?.filter,
      q,
      ...(age ? { age } : {}),
      ...(category ? { category } : {}),
      theme,
      mode,
      zoneId: zone?.id,
    },
    page,
  );
  const filtered = Object.values(current).some(Boolean);
  const extraFilters = [category, theme, mode, zone].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-5">
      <form action="/" role="search">
        {Object.entries(current).map(([key, value]) =>
          key !== "q" && value ? <input key={key} type="hidden" name={key} value={value} /> : null,
        )}
        <label htmlFor="q" className="sr-only">
          Поиск по названию и автору
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Название или автор"
          enterKeyHint="search"
          className="h-12 w-full rounded-[var(--radius-control)] border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-soft"
        />
      </form>

      <section aria-label="Быстрые подборки" className="-mx-4">
        <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar">
          {QUICK_COLLECTIONS.map((item) => (
            <Chip
              key={item.id}
              href={hrefWith(current, { c: item.id === collection?.id ? undefined : item.id })}
              active={item.id === collection?.id}
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
              key={group.id}
              href={hrefWith(current, { age: group.id === age ? undefined : group.id })}
              active={group.id === age}
            >
              {group.label}
            </Chip>
          ))}
        </div>
      </section>

      <details className="rounded-[var(--radius-card)] border border-line bg-surface" open={extraFilters > 0}>
        <summary className="flex min-h-12 cursor-pointer items-center px-4 text-[15px] font-semibold">
          Фильтры{extraFilters > 0 ? ` · ${extraFilters}` : ""}
        </summary>
        <form action="/" className="flex flex-col gap-3 px-4 pb-4">
          {q && <input type="hidden" name="q" value={q} />}
          {collection && <input type="hidden" name="c" value={collection.id} />}
          {age && <input type="hidden" name="age" value={age} />}
          <label className="flex flex-col gap-1 text-sm text-ink-soft">
            Категория
            <select name="cat" defaultValue={category ?? ""} className={SELECT}>
              <option value="">Любая</option>
              {CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-soft">
            Тема
            <select name="theme" defaultValue={theme ?? ""} className={SELECT}>
              <option value="">Любая</option>
              {THEMES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-soft">
            Пометка
            <select name="mode" defaultValue={mode ?? ""} className={SELECT}>
              <option value="">Любая</option>
              {(["gift", "lend"] as const).map((item) => (
                <option key={item} value={item}>
                  {MODE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-soft">
            Где
            <select name="zone" defaultValue={zone ? String(zone.id) : ""} className={SELECT}>
              <option value="">Весь район</option>
              {zones.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-ink px-5 font-semibold text-bg"
          >
            Показать
          </button>
        </form>
      </details>

      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-[28px] leading-tight font-semibold">
          {q ? "Нашлось" : collection ? collection.label : "Новые на полке"}
        </h1>
      </div>

      {books.length > 0 ? (
        <>
          <BookGrid books={books} />
          <nav aria-label="Страницы" className="flex justify-between gap-3">
            {page > 0 ? (
              <ButtonLink href={hrefWith(current, { page: page > 1 ? String(page - 1) : undefined })} variant="secondary">
                ← Назад
              </ButtonLink>
            ) : (
              <span />
            )}
            {hasMore && (
              <ButtonLink href={hrefWith(current, { page: String(page + 1) })} variant="secondary">
                Ещё книги →
              </ButtonLink>
            )}
          </nav>
        </>
      ) : (
        <EmptyState
          title={filtered ? "Таких книг пока нет" : "На полке пока пусто"}
          text={
            filtered ? "Попробуйте убрать часть фильтров." : "Выложите первую книгу — соседи увидят её сразу."
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
