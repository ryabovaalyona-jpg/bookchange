import type { Metadata } from "next";
import { BookCard, ModeBadge } from "@/components/book";
import { Badge, Button, Chip, EmptyState, SectionTitle, Tag } from "@/components/ui";
import { DEMO_BOOKS } from "@/lib/demo-books";
import { STYLE_VARIANTS } from "@/lib/style-variant";

export const metadata: Metadata = { title: "Стиль", robots: { index: false } };

const TOKENS = [
  { name: "bg", label: "Фон" },
  { name: "surface", label: "Поверхность" },
  { name: "surface-2", label: "Поверхность 2" },
  { name: "line", label: "Линия" },
  { name: "ink", label: "Текст" },
  { name: "ink-soft", label: "Текст второй" },
  { name: "accent", label: "Акцент" },
];

function Palette({ theme, title }: { theme: "paper" | "night"; title: string }) {
  return (
    <div data-theme={theme} className="rounded-[var(--radius-card)] border border-line bg-bg p-4 text-ink">
      <p className="mb-3 font-semibold">{title}</p>
      <ul className="grid grid-cols-4 gap-2">
        {TOKENS.map((token) => (
          <li key={token.name} className="flex flex-col gap-1 text-xs">
            <span
              className="h-12 rounded-[var(--radius-control)] border border-line"
              style={{ background: `var(--${token.name})` }}
            />
            {token.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DesignPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-[32px] leading-[1.1] font-semibold">Стиль сервиса</h1>
        <p className="mt-2 text-ink-soft">
          Цвета и шрифты ANIMI. Переключите вариант в полосе наверху, откройте полку и книгу —
          и выберите один.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle>Три варианта</SectionTitle>
        <ul className="flex flex-col gap-2">
          {STYLE_VARIANTS.map((variant) => (
            <li key={variant.id}>
              <span className="font-semibold">{variant.label}</span>
              <span className="text-ink-soft"> — {variant.hint}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Цвета</SectionTitle>
        <Palette theme="paper" title="Бумага" />
        <Palette theme="night" title="Ночь" />
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Шрифты</SectionTitle>
        <p className="font-display text-4xl leading-tight font-semibold">
          Cormorant Garamond — заголовки и названия книг
        </p>
        <p>
          Inter — весь остальной текст: кнопки, подписи, письма. Оба шрифта с кириллицей лежат на
          нашем сервере.
        </p>
        <p className="text-sm text-ink-soft">Второстепенный текст — мельче и спокойнее.</p>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Кнопки</SectionTitle>
        <div className="flex flex-wrap gap-3">
          <Button type="button">Хочу эту книгу</Button>
          <Button type="button" variant="secondary">
            Скрыть с полки
          </Button>
          <Button type="button" variant="ghost">
            Пожаловаться
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Фильтры и метки</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Chip href="/design" active>
            Про чувства
          </Chip>
          <Chip href="/design">Сказки</Chip>
          <Chip href="/design">3–4</Chip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModeBadge book={DEMO_BOOKS[0]} />
          <ModeBadge book={DEMO_BOOKS[1]} />
          <Badge>Обещана</Badge>
          <Badge>На руках</Badge>
          <Tag>5–6</Tag>
          <Tag>Страх темноты</Tag>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Карточка книги</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <BookCard book={DEMO_BOOKS[1]} />
          <BookCard book={DEMO_BOOKS[2]} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Пустой экран</SectionTitle>
        <EmptyState
          title="На полке пока пусто"
          text="Выложите первую книгу — соседи увидят её сразу."
          action={<Button type="button">Выложить книгу</Button>}
        />
      </section>
    </div>
  );
}
