import Link from "next/link";
import { setStyleVariant } from "@/app/actions";
import { STYLE_VARIANTS, type StyleVariant } from "@/lib/style-variant";

export const SERVICE_NAME = "Книжки по соседству";
export const DISTRICT_NAME = "Павшинская пойма";

const ANIMI_URL =
  "https://animistories.com/?utm_source=knizhki-po-sosedstvu&utm_medium=footer&utm_campaign=pilot";

export function SiteHeader({ theme }: { theme: "paper" | "night" }) {
  return (
    <header data-theme={theme} className="border-b border-line bg-bg text-ink">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex flex-col">
          <span className="font-display text-2xl leading-none font-semibold">{SERVICE_NAME}</span>
          <span className="mt-1 text-[13px] text-ink-soft">{DISTRICT_NAME}</span>
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line px-4 text-[15px] font-semibold hover:bg-surface"
        >
          Войти
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-3xl px-4 pt-10 pb-6 text-sm text-ink-soft">
      <p>
        Сервис сделала Алёна, автор{" "}
        <a href={ANIMI_URL} className="font-semibold text-ink underline underline-offset-2">
          ANIMI
        </a>{" "}
        — терапевтических сказок для детей.
      </p>
    </footer>
  );
}

/** Полоса выбора стиля. Живёт только до решения владельца. */
export function StyleSwitcher({ current }: { current: StyleVariant }) {
  return (
    <form
      action={setStyleVariant}
      data-theme="night"
      className="flex items-center gap-2 overflow-x-auto bg-surface-2 px-4 py-1.5 text-[13px] text-ink no-scrollbar"
    >
      <Link href="/design" className="shrink-0 underline underline-offset-2">
        Черновик стиля
      </Link>
      {STYLE_VARIANTS.map((variant) => (
        <button
          key={variant.id}
          name="style"
          value={variant.id}
          aria-pressed={variant.id === current}
          title={variant.hint}
          className={`min-h-8 shrink-0 rounded-full px-3 font-medium ${
            variant.id === current ? "bg-accent text-accent-ink" : "border border-line"
          }`}
        >
          {variant.label}
        </button>
      ))}
    </form>
  );
}
