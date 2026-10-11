import type { Metadata } from "next";
import { ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Моя полка" };

export default function ShelfPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[28px] leading-tight font-semibold">Моя полка</h1>
      <EmptyState
        title="На полке пока пусто"
        text="Выложите первую книгу — на вторую уйдёт полминуты."
        action={<ButtonLink href="/add">Выложить книгу</ButtonLink>}
      />
    </div>
  );
}
