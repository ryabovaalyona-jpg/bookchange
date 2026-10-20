import "server-only";

import { and, count, eq, gte } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { logEvent } from "./events";

export const REPORT_REASONS = [
  { id: "not_book", label: "Это не книга" },
  { id: "selling", label: "Продают или просят деньги" },
  { id: "inappropriate", label: "Неподходящее для детей" },
  { id: "unavailable", label: "Книги уже нет" },
  { id: "other", label: "Другое" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["id"];

const DAILY_LIMIT = 20;

export async function createReport(
  reporterId: string,
  target: { type: "book" | "user"; id: string },
  reason: string,
) {
  const db = await getDb();
  const [today] = await db
    .select({ n: count() })
    .from(schema.reports)
    .where(
      and(
        eq(schema.reports.reporterId, reporterId),
        gte(schema.reports.createdAt, new Date(Date.now() - 24 * 3600 * 1000)),
      ),
    );
  if ((today?.n ?? 0) >= DAILY_LIMIT) return false;
  await db.insert(schema.reports).values({ targetType: target.type, targetId: target.id, reporterId, reason });
  await logEvent("report_created", reporterId, { targetType: target.type });
  return true;
}
