"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "./ui";

export const FIELD =
  "h-12 w-full rounded-[var(--radius-control)] border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-soft";
export const LABEL = "text-[15px] font-semibold";

/** Кнопка отправки: пока форма уходит, показывает `pending` и не нажимается второй раз. */
export function SubmitButton({
  children,
  pending: pendingLabel,
  ...props
}: ComponentProps<typeof Button> & { pending?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[var(--radius-control)] border border-ink bg-surface p-3 text-[15px]">
      {message}
    </p>
  );
}

export function Checkbox({ name, children, required }: { name: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-[15px]">
      <input type="checkbox" name={name} required={required} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
      <span>{children}</span>
    </label>
  );
}
