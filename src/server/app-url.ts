import "server-only";

/** Адрес сервиса для ссылок наружу: вход, превью в чатах. */
export function appUrl(request?: Request) {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (request) return new URL(request.url).origin;
  return "http://localhost:3000";
}
