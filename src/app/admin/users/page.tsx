import Link from "next/link";
import { ADMIN_BUTTON, ADMIN_INPUT, DATE_TIME } from "@/components/admin-ui";
import { adminUsers } from "@/server/admin";
import { blockUserAction } from "../actions";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const q = String((await searchParams).q ?? "");
  const rows = await adminUsers(q);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[28px] leading-tight font-semibold">Участники</h1>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Имя" className={`${ADMIN_INPUT} flex-1`} />
        <button className={ADMIN_BUTTON}>Найти</button>
      </form>
      <ul className="flex flex-col gap-3">
        {rows.map((user) => (
          <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-3">
            <div>
              <Link href={`/neighbors/${user.id}`} className="font-semibold underline underline-offset-2">
                {user.displayName ?? "Без имени"}
              </Link>
              <p className="text-[13px] text-ink-soft">
                {user.zone ?? "зона не выбрана"} · книг: {user.books} · с {DATE_TIME.format(user.createdAt)}
                {user.role === "admin" && " · админ"}
                {user.status === "blocked" && " · заблокирован"}
              </p>
            </div>
            {user.role === "member" && (
              <form action={blockUserAction}>
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="blocked" value={user.status === "blocked" ? "0" : "1"} />
                <button className={ADMIN_BUTTON}>
                  {user.status === "blocked" ? "Разблокировать" : "Заблокировать"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
