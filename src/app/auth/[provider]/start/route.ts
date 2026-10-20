import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appUrl } from "@/server/app-url";
import { newPkce, OAUTH_COOKIE } from "@/server/auth/oauth";
import { getProvider } from "@/server/auth/providers";
import { allow, clientIp } from "@/server/rate-limit";
import { safeNext, secureCookies } from "@/server/session";

export async function GET(request: Request, ctx: RouteContext<"/auth/[provider]/start">) {
  const { provider: id } = await ctx.params;
  const provider = getProvider(id);
  const base = appUrl(request);
  if (!provider) return NextResponse.redirect(`${base}/login?error=provider`);
  if (!allow(`login:${await clientIp()}`, 20, 10 * 60 * 1000)) {
    return NextResponse.redirect(`${base}/login?error=rate`);
  }

  const { verifier, challenge, state } = newPkce();
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  (await cookies()).set(OAUTH_COOKIE, JSON.stringify({ id, state, verifier, next }), {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    path: "/auth",
    maxAge: 10 * 60,
  });

  const target = provider.authorizeUrl({
    redirectUri: `${base}/auth/${id}/callback`,
    state,
    codeChallenge: challenge,
  });
  return NextResponse.redirect(new URL(target, base));
}
