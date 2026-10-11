import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const BUTTON_BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] px-5 text-base font-semibold transition-colors disabled:opacity-50";

const BUTTON_VARIANTS = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink-soft underline-offset-4 hover:text-ink hover:underline",
} as const;

type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], className)} {...props} />;
}

/** Кнопка-фильтр. Область касания — 44 px. */
export function Chip({
  href,
  active = false,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cx(
        "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-[15px] font-medium whitespace-nowrap transition-colors",
        active
          ? "border-ink bg-ink text-bg"
          : "border-line bg-surface text-ink hover:bg-surface-2",
      )}
    >
      {children}
    </Link>
  );
}

/** Нейтральная метка: возраст, категория, тема. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-2 px-3 py-1 text-sm text-ink">
      {children}
    </span>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "accent" | "outline" | "neutral";
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] leading-5 font-semibold",
        tone === "accent" && "bg-accent text-accent-ink",
        tone === "outline" && "border border-ink bg-surface text-ink",
        tone === "neutral" && "bg-ink text-bg",
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-[26px] leading-tight font-semibold">{children}</h2>;
}

/** Пустой экран всегда подсказывает следующий шаг. */
export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-12 text-center">
      <p className="font-display text-2xl leading-tight font-semibold">{title}</p>
      {text && <p className="max-w-xs text-ink-soft">{text}</p>}
      {action}
    </div>
  );
}
