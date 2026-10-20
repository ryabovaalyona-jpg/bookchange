import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buttonClass } from "@/components/ui";
import { providerOptions } from "@/server/auth/providers";
import { getCurrentUser, safeNext } from "@/server/session";

export const metadata: Metadata = { title: "Вход", robots: { index: false } };

const ERRORS: Record<string, string> = {
  expired: "Вход не завершился. Попробуйте ещё раз.",
  cancelled: "Вы отменили вход.",
  provider: "Не получилось войти. Попробуйте ещё раз или другим способом.",
  blocked: "Этот аккаунт заблокирован. Если это ошибка — напишите нам.",
  rate: "Слишком много попыток. Подождите несколько минут.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);

  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;
  const providers = providerOptions().filter((provider) => provider.enabled);

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-5 py-6">
      <div>
        <h1 className="font-display text-[32px] leading-[1.1] font-semibold">Вход</h1>
        <p className="mt-2 text-ink-soft">
          Вход нужен, чтобы выложить книгу или попросить чужую. Смотреть полку можно и так.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-[var(--radius-control)] border border-line bg-surface p-3">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {providers.map((provider, index) => (
          <a
            key={provider.id}
            href={`/auth/${provider.id}/start?next=${encodeURIComponent(next)}`}
            className={buttonClass(index === 0 ? "primary" : "secondary")}
          >
            Войти через {provider.label}
          </a>
        ))}
        {providers.length === 0 && (
          <p className="text-ink-soft">Вход пока не настроен. Загляните чуть позже.</p>
        )}
      </div>

      <p className="text-sm text-ink-soft">Без паролей. Почту никто, кроме вас, не увидит.</p>
    </div>
  );
}
