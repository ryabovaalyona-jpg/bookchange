import type { Metadata } from "next";
import { ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Выложить книгу" };

export default function AddBookPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[28px] leading-tight font-semibold">Выложить книгу</h1>
      <EmptyState
        title="Скоро здесь можно будет выложить книгу"
        text="Вход через Яндекс ID и добавление книг появятся следующим шагом."
        action={
          <ButtonLink href="/" variant="secondary">
            Посмотреть полку
          </ButtonLink>
        }
      />
    </div>
  );
}
