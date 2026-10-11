"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/",
    label: "Полка",
    icon: "M5 4v16M10 4v16M15 5l4 15M3 20h18",
  },
  { href: "/add", label: "Выложить", icon: "M12 5v14M5 12h14" },
  {
    href: "/shelf",
    label: "Моя полка",
    icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Основное меню"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex h-16 max-w-3xl">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  active ? "text-ink" : "text-ink-soft"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2.2 : 1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={item.icon} />
                </svg>
                {item.label}
                <span
                  className={`h-0.5 w-6 rounded-full ${active ? "bg-accent" : "bg-transparent"}`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
