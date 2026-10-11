import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NeighborShelf } from "@/components/neighbor-shelf";
import { EmptyState } from "@/components/ui";
import { getDemoNeighbor, getNeighborBooks } from "@/lib/demo-books";

// Страницы участников закрыты от поисковиков (PRD, раздел 11).
export async function generateMetadata({ params }: PageProps<"/neighbors/[id]">): Promise<Metadata> {
  const neighbor = getDemoNeighbor((await params).id);
  return {
    title: neighbor ? `Полка соседа: ${neighbor.name}` : undefined,
    robots: { index: false },
  };
}

export default async function NeighborPage({ params }: PageProps<"/neighbors/[id]">) {
  const neighbor = getDemoNeighbor((await params).id);
  if (!neighbor) notFound();

  const books = getNeighborBooks(neighbor.name);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="inline-flex min-h-11 items-center text-[15px] text-ink-soft">
        ← Вся полка
      </Link>

      <div>
        <p className="text-sm text-ink-soft">Полка соседа</p>
        <h1 className="font-display text-[32px] leading-[1.1] font-semibold">{neighbor.name}</h1>
        <p className="mt-1 text-ink-soft">
          {neighbor.zone} · {books.length} кн.
        </p>
      </div>

      {books.length > 0 ? (
        <>
          <p className="text-[15px] text-ink-soft">
            Отметьте несколько книг — попросите их одним запросом и заберите за одну встречу.
          </p>
          <NeighborShelf books={books} />
        </>
      ) : (
        <EmptyState title="На этой полке пока пусто" text="Загляните позже или посмотрите всю полку района." />
      )}
    </div>
  );
}
