import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NeighborShelf } from "@/components/neighbor-shelf";
import { EmptyState } from "@/components/ui";
import { getNeighborBooks } from "@/server/books";
import { getCurrentUser } from "@/server/session";
import { getNeighbor } from "@/server/users";

// Страницы участников закрыты от поисковиков (PRD, раздел 11).
export async function generateMetadata({ params }: PageProps<"/neighbors/[id]">): Promise<Metadata> {
  const neighbor = await getNeighbor((await params).id);
  return {
    title: neighbor ? `Полка соседа: ${neighbor.displayName}` : undefined,
    robots: { index: false, follow: false },
  };
}

export default async function NeighborPage({ params }: PageProps<"/neighbors/[id]">) {
  const { id } = await params;
  const neighbor = await getNeighbor(id);
  if (!neighbor) notFound();

  const [books, viewer] = await Promise.all([getNeighborBooks(neighbor.id), getCurrentUser()]);
  const own = viewer?.id === neighbor.id;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="inline-flex min-h-11 items-center text-[15px] text-ink-soft">
        ← Вся полка
      </Link>

      <div>
        <p className="text-sm text-ink-soft">{own ? "Так соседи видят вашу полку" : "Полка соседа"}</p>
        <h1 className="font-display text-[32px] leading-[1.1] font-semibold">{neighbor.displayName}</h1>
        <p className="mt-1 text-ink-soft">
          {neighbor.zone} · {books.length} кн.
        </p>
      </div>

      {books.length > 0 ? (
        <>
          {!own && (
            <p className="text-[15px] text-ink-soft">
              Отметьте несколько книг — попросите их одним запросом и заберите за одну встречу.
            </p>
          )}
          <NeighborShelf books={books} back={`/neighbors/${neighbor.id}`} own={own} />
        </>
      ) : (
        <EmptyState title="На этой полке пока пусто" text="Загляните позже или посмотрите всю полку района." />
      )}
    </div>
  );
}
