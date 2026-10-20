"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { BookSuggestion } from "@/lib/book-lookup";
import {
  AGE_GROUPS,
  CATEGORIES,
  CONDITIONS,
  LEND_DAYS,
  LEND_LABELS,
  THEMES,
  type AgeGroup,
  type BookMode,
  type Category,
  type Condition,
  type LendDays,
  type Theme,
} from "@/lib/dictionaries";
import { BookCover } from "./book";
import { FIELD, FormError, LABEL } from "./form";
import { Button, ButtonLink } from "./ui";

const MAX_SIDE = 1600;
const MAX_PHOTOS = 3;

export type BookFormState = { error?: string; savedId?: number; savedAt?: number } | undefined;

export type BookFormDefaults = {
  title?: string;
  author?: string | null;
  ageGroups?: AgeGroup[];
  category?: Category | null;
  themes?: Theme[];
  condition?: Condition;
  mode?: BookMode;
  lendDays?: LendDays | null;
  note?: string | null;
  /** Уже сохранённые фото — только при правке. */
  photoUrls?: string[];
};

type Photo = { key: string; url: string; blob?: Blob; catalogId?: number };

/** Обрезает фото по центру под 3:4 и сжимает до 1600 px по длинной стороне. */
async function cropPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const cropWidth = Math.min(bitmap.width, (bitmap.height * 3) / 4);
  const cropHeight = (cropWidth * 4) / 3;
  const height = Math.min(MAX_SIDE, cropHeight);
  const width = (height * 3) / 4;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas
    .getContext("2d")!
    .drawImage(
      bitmap,
      (bitmap.width - cropWidth) / 2,
      (bitmap.height - cropHeight) / 2,
      cropWidth,
      cropHeight,
      0,
      0,
      width,
      height,
    );
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("crop failed");
  return blob;
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[15px] font-medium ${
        active ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

export function AddBookForm({
  action,
  defaults = {},
  editing = false,
}: {
  action: (state: BookFormState, formData: FormData) => Promise<BookFormState>;
  defaults?: BookFormDefaults;
  editing?: boolean;
}) {
  const [state, dispatch, pending] = useActionState(action, undefined);

  const [title, setTitle] = useState(defaults.title ?? "");
  const [author, setAuthor] = useState(defaults.author ?? "");
  const [photos, setPhotos] = useState<Photo[]>(
    (defaults.photoUrls ?? []).map((url) => ({ key: url, url })),
  );
  const [photosChanged, setPhotosChanged] = useState(false);
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [lookup, setLookup] = useState<"idle" | "loading" | "done">("idle");
  const [photoError, setPhotoError] = useState(false);
  const [ages, setAges] = useState<AgeGroup[]>(defaults.ageGroups ?? []);
  const [category, setCategory] = useState<string>(defaults.category ?? "");
  const [themes, setThemes] = useState<Theme[]>(defaults.themes ?? []);
  const [condition, setCondition] = useState<Condition | undefined>(defaults.condition);
  const [mode, setMode] = useState<BookMode>(defaults.mode ?? "gift");
  const [lendDays, setLendDays] = useState<LendDays>(defaults.lendDays ?? 30);
  const [note, setNote] = useState(defaults.note ?? "");
  const [savedShown, setSavedShown] = useState<number>();

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const requestId = useRef(0);
  const titleRef = useRef<HTMLInputElement>(null);

  // После сохранения — экран «Книга на полке»; возраст и пометка остаются для следующей.
  useEffect(() => {
    if (!state?.savedAt || editing) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- сброс формы после ответа сервера
    setSavedShown(state.savedId);
    setTitle("");
    setAuthor("");
    setPhotos([]);
    setCategory("");
    setThemes([]);
    setCondition(undefined);
    setNote("");
    setSuggestions([]);
    setLookup("idle");
    window.scrollTo({ top: 0 });
  }, [state?.savedAt, state?.savedId, editing]);

  function onTitleChange(value: string) {
    setTitle(value);
    clearTimeout(timer.current);
    const query = value.trim();
    if (query.length < 3) {
      requestId.current += 1;
      setSuggestions([]);
      setLookup("idle");
      return;
    }
    setLookup("loading");
    timer.current = setTimeout(async () => {
      const id = ++requestId.current;
      try {
        const response = await fetch(`/api/book-lookup?q=${encodeURIComponent(query)}`);
        const body = (await response.json()) as { suggestions: BookSuggestion[] };
        if (id !== requestId.current) return;
        setSuggestions(body.suggestions);
      } catch {
        if (id !== requestId.current) return;
        setSuggestions([]);
      }
      setLookup("done");
    }, 400);
  }

  function pick(suggestion: BookSuggestion) {
    clearTimeout(timer.current);
    requestId.current += 1;
    setTitle(suggestion.title);
    setAuthor(suggestion.author);
    setPhotosChanged(true);
    setPhotos((current) => [
      { key: `catalog-${suggestion.sourceId}`, url: suggestion.coverUrl, catalogId: suggestion.sourceId },
      ...current.filter((photo) => photo.blob).slice(0, MAX_PHOTOS - 1),
    ]);
    if (suggestion.ageGroup && ages.length === 0) setAges([suggestion.ageGroup]);
    setSuggestions([]);
    setLookup("idle");
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError(false);
    try {
      const blob = await cropPhoto(file);
      setPhotosChanged(true);
      setPhotos((current) => {
        return [...editable(current), { key: crypto.randomUUID(), url: URL.createObjectURL(blob), blob }].slice(
          0,
          MAX_PHOTOS,
        );
      });
      setSuggestions([]);
      setLookup("idle");
    } catch {
      setPhotoError(true);
    }
  }

  // При правке новые фото заменяют сохранённые целиком: первое изменение убирает старые.
  function editable(current: Photo[]) {
    return photosChanged ? current : current.filter((photo) => photo.blob || photo.catalogId);
  }

  function removePhoto(key: string) {
    setPhotosChanged(true);
    setPhotos((current) => editable(current).filter((photo) => photo.key !== key));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const data = new FormData();
    data.set("title", title);
    data.set("author", author);
    for (const age of ages) data.append("ageGroups", age);
    data.set("category", category);
    for (const theme of themes) data.append("themes", theme);
    if (condition) data.set("condition", condition);
    data.set("mode", mode);
    if (mode === "lend") data.set("lendDays", String(lendDays));
    data.set("note", note);
    if (photosChanged) {
      const catalog = photos.find((photo) => photo.catalogId);
      if (catalog) data.set("catalogId", String(catalog.catalogId));
      photos.forEach((photo, index) => {
        if (photo.blob) data.append("photos", photo.blob, `photo-${index}.jpg`);
      });
    }
    startTransition(() => dispatch(data));
  }

  const missing = [
    !title.trim() && "название",
    photos.length === 0 && "обложку",
    ages.length === 0 && "возраст",
    !condition && "состояние",
  ].filter(Boolean);

  if (savedShown && !editing) {
    return (
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <p role="status" className="font-display text-2xl leading-tight font-semibold">
          Книга на полке
        </p>
        <p className="text-ink-soft">Соседи уже её видят. Возраст и пометка подставятся в следующую.</p>
        <Button
          type="button"
          onClick={() => {
            setSavedShown(undefined);
            setTimeout(() => titleRef.current?.focus(), 0);
          }}
        >
          Добавить ещё одну
        </Button>
        <ButtonLink href={`/books/${savedShown}`} variant="secondary">
          Открыть книгу
        </ButtonLink>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className={LABEL}>
          Название книги
        </label>
        <input
          id="title"
          ref={titleRef}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Начните вводить — подскажем"
          autoComplete="off"
          maxLength={200}
          className={FIELD}
        />

        {lookup === "loading" && <p className="text-sm text-ink-soft">Ищем книгу…</p>}

        {suggestions.length > 0 && (
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {suggestions.map((suggestion) => (
              <li key={suggestion.sourceId}>
                <button
                  type="button"
                  onClick={() => pick(suggestion)}
                  className="flex min-h-11 w-full items-center gap-3 p-2 text-left hover:bg-surface-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- миниатюра подсказки */}
                  <img
                    src={suggestion.coverUrl}
                    alt=""
                    loading="lazy"
                    className="aspect-[3/4] w-12 shrink-0 rounded bg-surface-2 object-cover"
                  />
                  <span className="flex flex-col">
                    <span className="text-[15px] leading-snug font-semibold">{suggestion.title}</span>
                    {suggestion.author && (
                      <span className="text-[13px] text-ink-soft">{suggestion.author}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {lookup === "done" && suggestions.length === 0 && photos.length === 0 && (
          <p className="text-sm text-ink-soft">
            Такой книги в каталоге не нашлось — сфотографируйте обложку.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className={LABEL}>Фото — от одного до трёх</span>
        <div className="flex flex-wrap items-start gap-3">
          {photos.map((photo, index) => (
            <div key={photo.key} className="flex w-28 flex-col gap-1">
              <BookCover title={title || "Обложка"} author={author} src={photo.url} />
              <button
                type="button"
                onClick={() => removePhoto(photo.key)}
                className="min-h-11 text-[13px] text-ink-soft underline underline-offset-2"
                aria-label={`Убрать фото ${index + 1}`}
              >
                Убрать
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="flex aspect-[3/4] w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] border border-dashed border-line bg-surface p-2 text-center text-[13px] leading-tight font-semibold hover:bg-surface-2">
              <span aria-hidden="true" className="text-2xl leading-none">
                +
              </span>
              {photos.length === 0 ? "Снять обложку" : "Ещё фото"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                data-testid="photo-input"
                onChange={(event) => {
                  void onPhoto(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        <p className="text-sm text-ink-soft">
          {photos.some((photo) => photo.catalogId)
            ? "Обложка из каталога. Если издание другое — уберите её и сфотографируйте свою."
            : "Выберите книгу из подсказок или сфотографируйте обложку. Можно добавить разворот."}
        </p>
        {photoError && (
          <p role="alert" className="text-sm">
            Не получилось открыть фото. Попробуйте другое.
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${LABEL} mb-2`}>Возраст — можно несколько</legend>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((group) => (
            <ChoiceButton
              key={group.id}
              active={ages.includes(group.id)}
              onClick={() => setAges((current) => toggle(current, group.id))}
            >
              {group.label}
            </ChoiceButton>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${LABEL} mb-2`}>Состояние</legend>
        {CONDITIONS.map((item) => (
          <label
            key={item.id}
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border px-3 py-2 ${
              condition === item.id ? "border-ink bg-surface-2" : "border-line bg-surface"
            }`}
          >
            <input
              type="radio"
              name="condition"
              checked={condition === item.id}
              onChange={() => setCondition(item.id)}
              className="size-5 accent-[var(--accent)]"
            />
            <span className="flex flex-col">
              <span className="text-[15px] font-semibold">{item.label}</span>
              <span className="text-[13px] text-ink-soft">{item.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${LABEL} mb-2`}>Что делаете с книгой</legend>
        <div className="flex flex-wrap gap-2">
          <ChoiceButton active={mode === "gift"} onClick={() => setMode("gift")}>
            Отдаю
          </ChoiceButton>
          <ChoiceButton active={mode === "lend"} onClick={() => setMode("lend")}>
            Даю почитать
          </ChoiceButton>
        </div>
        {mode === "lend" && (
          <div className="flex flex-wrap gap-2">
            {LEND_DAYS.map((days) => (
              <ChoiceButton key={days} active={lendDays === days} onClick={() => setLendDays(days)}>
                {LEND_LABELS[days]}
              </ChoiceButton>
            ))}
          </div>
        )}
      </fieldset>

      <details
        className="rounded-[var(--radius-card)] border border-line bg-surface"
        open={editing && Boolean(defaults.category || defaults.themes?.length || defaults.note)}
      >
        <summary className="flex min-h-12 cursor-pointer items-center px-4 text-[15px] font-semibold">
          Ещё: автор, категория, темы, комментарий
        </summary>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="author" className={LABEL}>
              Автор
            </label>
            <input
              id="author"
              value={author}
              maxLength={200}
              onChange={(event) => setAuthor(event.target.value)}
              className={FIELD}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="category" className={LABEL}>
              Категория
            </label>
            <select
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={FIELD}
            >
              <option value="">Не выбрана</option>
              {CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className={`${LABEL} mb-2`}>Темы «про чувства»</legend>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((theme) => (
                <ChoiceButton
                  key={theme.id}
                  active={themes.includes(theme.id)}
                  onClick={() => setThemes((current) => toggle(current, theme.id))}
                >
                  {theme.label}
                </ChoiceButton>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-2">
            <label htmlFor="note" className={LABEL}>
              Комментарий
            </label>
            <textarea
              id="note"
              maxLength={300}
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Например: на двух страницах рисунки фломастером"
              className={`${FIELD} h-auto py-3`}
            />
          </div>
        </div>
      </details>

      <FormError message={state?.error} />
      {editing && state?.savedAt && !state.error && (
        <p role="status" className="text-center font-medium">
          Сохранено. <Link href={`/books/${state.savedId}`} className="underline underline-offset-2">Открыть книгу</Link>
        </p>
      )}

      <div className="sticky bottom-16 -mx-4 flex flex-col gap-1 border-t border-line bg-bg px-4 py-3">
        <Button type="submit" className="w-full" disabled={missing.length > 0 || pending}>
          {pending ? "Сохраняем…" : editing ? "Сохранить" : "Выложить книгу"}
        </Button>
        {missing.length > 0 && (
          <p className="text-center text-[13px] text-ink-soft">Осталось указать: {missing.join(", ")}.</p>
        )}
      </div>
    </form>
  );
}
