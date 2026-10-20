import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { logEvent } from "../events";
import type { ProviderId, ProviderProfile } from "./providers";

export const OAUTH_COOKIE = "oauth";

export function newPkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge, state: randomBytes(16).toString("base64url") };
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Находит или создаёт участника по паре «провайдер + идентификатор». */
export async function upsertUser(provider: ProviderId, profile: ProviderProfile) {
  const db = await getDb();
  const email = profile.email?.toLowerCase() ?? null;
  const isAdmin = email !== null && adminEmails().includes(email);
  const [row] = await db
    .insert(schema.users)
    .values({
      provider,
      providerUserId: profile.providerUserId,
      email,
      // Имя от провайдера — только подсказка для экрана знакомства.
      displayName: profile.name?.slice(0, 40) || null,
      role: isAdmin ? "admin" : "member",
    })
    .onConflictDoUpdate({
      target: [schema.users.provider, schema.users.providerUserId],
      set: {
        email: sql`coalesce(${schema.users.email}, excluded.email)`,
        ...(isAdmin ? { role: "admin" as const } : {}),
      },
    })
    .returning({
      id: schema.users.id,
      status: schema.users.status,
      createdAt: schema.users.createdAt,
    });
  if (Date.now() - row.createdAt.getTime() < 5000) await logEvent("user_signed_up", row.id, { provider });
  return row;
}
