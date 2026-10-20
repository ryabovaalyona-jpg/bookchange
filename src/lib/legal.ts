// Версии правовых документов. Меняется текст — меняется версия, и участник соглашается заново.
// Все тексты — черновики: их проверяет юрист (PRD, раздел 12).

export const LEGAL_DOCS = {
  consent: { version: "2026-10-20-draft", title: "Согласие на обработку персональных данных", href: "/legal/consent" },
  rules: { version: "2026-10-20-draft", title: "Правила сервиса", href: "/legal/rules" },
  privacy: { version: "2026-10-20-draft", title: "Политика обработки персональных данных", href: "/legal/privacy" },
} as const;

export type LegalDoc = keyof typeof LEGAL_DOCS;
