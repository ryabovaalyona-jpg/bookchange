import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appUrl } from "@/server/app-url";
import { OAUTH_COOKIE, upsertUser } from "@/server/auth/oauth";
import { getProvider, type ProviderId } from "@/server/auth/providers";
import { safeNext, startSession } from "@/server/session";

type Pending = { id: string; state: string; verifier: string; next: string };

export async function GET(request: Request, ctx: RouteContext<"/auth/[provider]/callback">) {
  const { provider: id } = await ctx.params;
  const base = appUrl(request);
  const fail = (reason: string) => NextResponse.redirect(`${base}/login?error=${reason}`);

  const jar = await cookies();
  const raw = jar.get(OAUTH_COOKIE)?.value;
  jar.delete({ name: OAUTH_COOKIE, path: "/auth" });

  const provider = getProvider(id);
  const query = new URL(request.url).searchParams;
  let pending: Pending;
  try {
    pending = JSON.parse(raw ?? "");
  } catch {
    return fail("expired");
  }
  if (!provider || pending.id !== id || query.get("state") !== pending.state) return fail("expired");
  if (query.get("error")) return fail("cancelled");

  let user;
  try {
    const profile = await provider.exchange({
      query,
      redirectUri: `${base}/auth/${id}/callback`,
      state: pending.state,
      codeVerifier: pending.verifier,
    });
    user = await upsertUser(id as ProviderId, profile);
  } catch (error) {
    console.error("login failed", id, error instanceof Error ? error.message : error);
    return fail("provider");
  }
  if (user.status !== "active") return fail("blocked");

  await startSession(user.id);
  const next = safeNext(pending.next);
  return NextResponse.redirect(`${base}/welcome?next=${encodeURIComponent(next)}`);
}
