import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Админка", robots: { index: false } };

const SECTIONS = [
  { href: "/admin", label: "Счётчики" },
  { href: "/admin/books", label: "Книги" },
  { href: "/admin/reports", label: "Жалобы" },
  { href: "/admin/users", label: "Участники" },
  { href: "/admin/zones", label: "Зоны" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Разделы админки" className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line bg-surface px-4 text-[15px] font-medium"
          >
            {section.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
