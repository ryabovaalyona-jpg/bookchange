import Link from "next/link";
import { getCurrentUser } from "@/server/session";

export const SERVICE_NAME = "Книжки по соседству";
export const DISTRICT_NAME = "Павшинская пойма";

const HEADER_LINK =
  "inline-flex min-h-11 max-w-32 items-center truncate rounded-[var(--radius-control)] border border-line px-3 text-[15px] font-semibold hover:bg-surface";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header data-theme="night" className="border-b border-line bg-bg text-ink">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 flex-col">
          <span className="font-display text-[22px] leading-none font-semibold sm:text-2xl">{SERVICE_NAME}</span>
          <span className="mt-1 text-[13px] text-ink-soft">{DISTRICT_NAME}</span>
        </Link>
        <div className="flex shrink-0 items-center">
          {user ? (
            <Link href={user.onboarded ? "/profile" : "/welcome"} className={HEADER_LINK}>
              {user.displayName ?? "Профиль"}
            </Link>
          ) : (
            <Link href="/login" className={HEADER_LINK}>
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pt-10 pb-6 text-sm text-ink-soft">
      <p>
        Сервис сделала Алёна, автор{" "}
        <a href="/go/animi" className="font-semibold text-ink underline underline-offset-2">
          ANIMI
        </a>{" "}
        — терапевтических сказок для детей.
      </p>
      <nav aria-label="Документы" className="flex flex-wrap gap-x-4">
        <Link href="/legal/rules" className="inline-flex min-h-11 items-center underline underline-offset-2">
          Правила
        </Link>
        <Link href="/legal/privacy" className="inline-flex min-h-11 items-center underline underline-offset-2">
          Политика данных
        </Link>
        <Link href="/legal/consent" className="inline-flex min-h-11 items-center underline underline-offset-2">
          Согласие
        </Link>
      </nav>
    </footer>
  );
}
