export const ADMIN_BUTTON =
  "inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line bg-surface px-3 text-[15px] font-medium hover:bg-surface-2";
export const ADMIN_INPUT =
  "h-11 rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base text-ink";

export const DATE_TIME = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});
