import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

// Запросы админки. Каждый вызов из действий админки идёт после requireAdmin().
// Почту, контакт и данные входа участников админка не показывает.

const { books, users, zones, reports, events, sessions } = schema;

export type DailyRow = { day: string; users: number; books: number; interests: number };

/** Счётчики по дням за последние `days` дней (PRD, раздел 6). Время — московское. */
export async function dailyCounters(days = 14): Promise<DailyRow[]> {
  const db = await getDb();
  const result = await db.execute(sql`
    with days as (
      select generate_series(
        (now() at time zone 'Europe/Moscow')::date - ${days - 1}::int,
        (now() at time zone 'Europe/Moscow')::date,
        interval '1 day'
      )::date as day
    ),
    counted as (
      select (created_at at time zone 'Europe/Moscow')::date as day, type, count(*)::int as n
      from ${events}
      where created_at > now() - make_interval(days => ${days + 1}::int)
        and type in ('user_onboarded', 'book_created', 'interest')
      group by 1, 2
    )
    select to_char(d.day, 'YYYY-MM-DD') as day,
      coalesce(sum(n) filter (where type = 'user_onboarded'), 0)::int as users,
      coalesce(sum(n) filter (where type = 'book_created'), 0)::int as books,
      coalesce(sum(n) filter (where type = 'interest'), 0)::int as interests
    from days d left join counted c on c.day = d.day
    group by d.day order by d.day desc
  `);
  return (result as unknown as { rows: DailyRow[] }).rows;
}

export async function totals() {
  const db = await getDb();
  const [members] = await db
    .select({ n: count() })
    .from(users)
    .where(sql`${users.adultConfirmedAt} is not null`);
  const [onShelf] = await db
    .select({ n: count(), owners: sql<number>`count(distinct ${books.ownerId})::int` })
    .from(books)
    .where(inArray(books.status, ["available", "reserved", "on_loan"]));
  const [wants] = await db.select({ n: count() }).from(schema.interests);
  const [openReports] = await db.select({ n: count() }).from(reports).where(eq(reports.status, "open"));
  return {
    members: members.n,
    books: onShelf.n,
    owners: onShelf.owners,
    booksPerOwner: onShelf.owners ? Math.round((onShelf.n / onShelf.owners) * 10) / 10 : 0,
    interests: wants.n,
    openReports: openReports.n,
  };
}

export async function adminBooks(q: string) {
  const db = await getDb();
  const needle = q.trim().slice(0, 100);
  return db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      status: books.status,
      createdAt: books.createdAt,
      owner: users.displayName,
      ownerId: users.id,
      moderationReason: books.moderationReason,
    })
    .from(books)
    .innerJoin(users, eq(users.id, books.ownerId))
    .where(needle ? or(ilike(books.title, `%${needle}%`), ilike(books.author, `%${needle}%`)) : undefined)
    .orderBy(desc(books.createdAt))
    .limit(100);
}

export async function moderateBook(bookId: number, action: "hide" | "remove" | "restore", reason: string) {
  const db = await getDb();
  const set =
    action === "remove"
      ? { status: "removed" as const, moderationReason: reason || "Нарушение правил сервиса" }
      : action === "hide"
        ? { status: "hidden" as const }
        : { status: "available" as const, moderationReason: null };
  await db.update(books).set(set).where(eq(books.id, bookId));
}

export async function openReports() {
  const db = await getDb();
  return db
    .select({
      id: reports.id,
      targetType: reports.targetType,
      targetId: reports.targetId,
      reason: reports.reason,
      createdAt: reports.createdAt,
      status: reports.status,
    })
    .from(reports)
    .orderBy(sql`${reports.status} = 'open' desc`, desc(reports.createdAt))
    .limit(100);
}

export async function closeReport(reportId: number, status: "resolved" | "dismissed") {
  const db = await getDb();
  await db.update(reports).set({ status, resolvedAt: new Date() }).where(eq(reports.id, reportId));
}

export async function adminUsers(q: string) {
  const db = await getDb();
  const needle = q.trim().slice(0, 100);
  return db
    .select({
      id: users.id,
      displayName: users.displayName,
      zone: zones.name,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      books: sql<number>`(select count(*)::int from ${books} where ${books.ownerId} = ${users.id})`,
    })
    .from(users)
    .leftJoin(zones, eq(zones.id, users.zoneId))
    .where(needle ? ilike(users.displayName, `%${needle}%`) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(200);
}

/** Блокировка скрывает книги участника из каталога и закрывает его сессии. */
export async function setUserBlocked(userId: string, blocked: boolean) {
  const db = await getDb();
  await db
    .update(users)
    .set({ status: blocked ? "blocked" : "active" })
    .where(and(eq(users.id, userId), eq(users.role, "member")));
  if (blocked) await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function allZones() {
  const db = await getDb();
  return db
    .select({
      id: zones.id,
      name: zones.name,
      sort: zones.sort,
      isActive: zones.isActive,
      members: sql<number>`(select count(*)::int from ${users} where ${users.zoneId} = ${zones.id})`,
    })
    .from(zones)
    .orderBy(asc(zones.sort), asc(zones.name));
}

export async function saveZone(data: { id?: number; name: string; sort: number; isActive: boolean }) {
  const db = await getDb();
  if (data.id) {
    await db
      .update(zones)
      .set({ name: data.name, sort: data.sort, isActive: data.isActive })
      .where(eq(zones.id, data.id));
    return;
  }
  const [district] = await db.select({ id: schema.districts.id }).from(schema.districts).limit(1);
  await db.insert(zones).values({ districtId: district.id, name: data.name, sort: data.sort });
}
