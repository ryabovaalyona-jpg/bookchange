import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui";
import { devProviderEnabled } from "@/server/auth/providers";

export const metadata: Metadata = { title: "Тестовый вход", robots: { index: false } };

const FIELD =
  "h-12 w-full rounded-[var(--radius-control)] border border-line bg-surface px-4 text-base text-ink";

// Подставной провайдер для разработки и автотестов: изображает экран Яндекс ID или VK ID.
export default async function DevLoginPage({ searchParams }: PageProps<"/auth/dev-login">) {
  if (!devProviderEnabled()) notFound();
  const sp = await searchParams;
  const redirectUri = typeof sp.redirect_uri === "string" ? sp.redirect_uri : "";
  const state = typeof sp.state === "string" ? sp.state : "";
  if (!redirectUri.endsWith("/auth/dev/callback")) notFound();

  return (
    <form action={redirectUri} method="get" className="mx-auto flex max-w-sm flex-col gap-4 py-6">
      <h1 className="font-display text-[32px] leading-[1.1] font-semibold">Тестовый вход</h1>
      <p className="text-ink-soft">Только для разработки. На сервере этого экрана нет.</p>
      <input type="hidden" name="state" value={state} />
      <label className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold">Идентификатор у провайдера</span>
        <input name="uid" required defaultValue="tester" pattern="[\w.\-]{1,64}" className={FIELD} />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold">Имя</span>
        <input name="name" defaultValue="Тестер" className={FIELD} />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold">Почта (можно пустую)</span>
        <input name="email" type="email" className={FIELD} />
      </label>
      <Button type="submit">Войти</Button>
    </form>
  );
}
