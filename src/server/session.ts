import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb, schema } from "@/db";

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 60;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function secureCookies() {
  return process.env.NODE_ENV === "production";
}

/** Создаёт сессию и ставит cookie. Только в серверном действии или обработчике маршрута. */
export async function startSession(userId: string) {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
  await db.insert(schema.sessions).values({ id: hashToken(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)));
  }
  jar.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: string;
  displayName: string | null;
  zoneId: number | null;
  role: "member" | "admin";
  onboarded: boolean;
};

/** Текущий участник или `null`. Заблокированный участник считается вышедшим. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [row] = await db
    .select({
      id: schema.users.id,
      displayName: schema.users.displayName,
      zoneId: schema.users.zoneId,
      role: schema.users.role,
      status: schema.users.status,
      adultConfirmedAt: schema.users.adultConfirmedAt,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, hashToken(token)), gt(schema.sessions.expiresAt, new Date())));
  if (!row || row.status !== "active") return null;
  return {
    id: row.id,
    displayName: row.displayName,
    zoneId: row.zoneId,
    role: row.role,
    onboarded: Boolean(row.adultConfirmedAt && row.displayName && row.zoneId),
  };
});

/** Участник, прошедший знакомство; иначе — на вход или на экран знакомства. */
export async function requireMember(next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!user.onboarded) redirect(`/welcome?next=${encodeURIComponent(next)}`);
  return user as SessionUser & { displayName: string; zoneId: number };
}

export async function requireAdmin() {
  const user = await requireMember("/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

/** Разрешает только внутренние переходы после входа. */
export function safeNext(value: unknown, fallback = "/") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : fallback;
}
