import type { Metadata } from "next";
import { Button } from "@/components/ui";

export const metadata: Metadata = { title: "Вход", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-5 py-6">
      <div>
        <h1 className="font-display text-[32px] leading-[1.1] font-semibold">Вход</h1>
        <p className="mt-2 text-ink-soft">
          Вход нужен, чтобы выложить книгу или попросить чужую. Смотреть полку можно и так.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button type="button" disabled>
          Войти через Яндекс ID
        </Button>
        <Button type="button" variant="secondary" disabled>
          Войти через VK ID
        </Button>
      </div>

      <p className="text-sm text-ink-soft">
        Без паролей. Вход подключим следующим шагом — пока кнопки не работают.
      </p>
    </div>
  );
}
