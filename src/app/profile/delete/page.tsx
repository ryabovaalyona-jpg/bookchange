import type { Metadata } from "next";
import Link from "next/link";
import { Checkbox } from "@/components/form";
import { Button } from "@/components/ui";
import { requireMember } from "@/server/session";
import { removeAccount } from "../actions";

export const metadata: Metadata = { title: "Удалить аккаунт", robots: { index: false } };

export default async function DeleteAccountPage({ searchParams }: PageProps<"/profile/delete">) {
  await requireMember("/profile/delete");
  const { error } = await searchParams;

  return (
    <form action={removeAccount} className="mx-auto flex max-w-sm flex-col gap-4">
      <Link href="/profile" className="inline-flex min-h-11 items-center text-[15px] text-ink-soft">
        ← Профиль
      </Link>
      <h1 className="font-display text-[28px] leading-tight font-semibold">Удалить аккаунт</h1>
      <p>
        Удалятся профиль, все ваши книги и фото. Вернуть их будет нельзя. Чтобы снова пользоваться
        сервисом, достаточно войти ещё раз.
      </p>
      {error && <p role="alert">Отметьте, что понимаете последствия.</p>}
      <Checkbox name="confirm" required>
        Понимаю, что книги и фото удалятся насовсем
      </Checkbox>
      <Button type="submit">Удалить аккаунт</Button>
    </form>
  );
}
