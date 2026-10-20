import "server-only";

import { headers } from "next/headers";

// Простое ограничение частоты в памяти процесса: на пилоте один сервер и один процесс.
const hits = new Map<string, number[]>();

export function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) {
    for (const [k, times] of hits) if (times.every((time) => now - time >= windowMs)) hits.delete(k);
  }
  return true;
}

/** IP участника за Caddy. */
export async function clientIp() {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "local";
}
