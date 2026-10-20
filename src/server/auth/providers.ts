import "server-only";

// Провайдеры входа (PRD, раздел 11). Сверено с документацией 20 октября 2026:
// Яндекс ID — yandex.ru/dev/id/doc/ru/codes/code-url, /user-information;
// VK ID — id.vk.ru/about/business/go/docs/ru/vkid/latest/vk-id/connection/api-description.
//
// Подставной провайдер `dev` нужен для разработки и автотестов. Он включается только
// переменной AUTH_DEV_PROVIDER=1 и никогда — в сборке для сервера.

const TIMEOUT_MS = 8000;

export type ProviderId = "yandex" | "vk" | "dev";

export type ProviderProfile = {
  providerUserId: string;
  email: string | null;
  name: string | null;
};

export type StartParams = { redirectUri: string; state: string; codeChallenge: string };
export type CallbackParams = {
  redirectUri: string;
  state: string;
  codeVerifier: string;
  query: URLSearchParams;
};

type Provider = {
  label: string;
  configured: () => boolean;
  authorizeUrl: (params: StartParams) => string;
  exchange: (params: CallbackParams) => Promise<ProviderProfile>;
};

function env(name: string) {
  return process.env[name]?.trim() || "";
}

async function postForm(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

const yandex: Provider = {
  label: "Яндекс ID",
  configured: () => Boolean(env("YANDEX_CLIENT_ID") && env("YANDEX_CLIENT_SECRET")),
  authorizeUrl: ({ redirectUri, state, codeChallenge }) => {
    const url = new URL("https://oauth.yandex.ru/authorize");
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: env("YANDEX_CLIENT_ID"),
      redirect_uri: redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      force_confirm: "no",
    }).toString();
    return url.toString();
  },
  exchange: async ({ query, codeVerifier }) => {
    const code = query.get("code");
    if (!code) throw new Error("yandex: no code");
    const token = (await postForm("https://oauth.yandex.ru/token", {
      grant_type: "authorization_code",
      code,
      client_id: env("YANDEX_CLIENT_ID"),
      client_secret: env("YANDEX_CLIENT_SECRET"),
      code_verifier: codeVerifier,
    })) as { access_token: string };
    const response = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { authorization: `OAuth ${token.access_token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`yandex info: ${response.status}`);
    const info = (await response.json()) as {
      id: string;
      default_email?: string;
      first_name?: string;
    };
    return {
      providerUserId: String(info.id),
      email: info.default_email || null,
      name: info.first_name || null,
    };
  },
};

const vk: Provider = {
  label: "VK ID",
  configured: () => Boolean(env("VK_CLIENT_ID")),
  authorizeUrl: ({ redirectUri, state, codeChallenge }) => {
    const url = new URL("https://id.vk.ru/authorize");
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: env("VK_CLIENT_ID"),
      redirect_uri: redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      scope: "email",
    }).toString();
    return url.toString();
  },
  exchange: async ({ query, redirectUri, state, codeVerifier }) => {
    const code = query.get("code");
    const deviceId = query.get("device_id");
    if (!code || !deviceId) throw new Error("vk: no code");
    const token = (await postForm("https://id.vk.ru/oauth2/auth", {
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      code,
      client_id: env("VK_CLIENT_ID"),
      device_id: deviceId,
      state,
    })) as { access_token: string };
    const info = (await postForm("https://id.vk.ru/oauth2/user_info", {
      client_id: env("VK_CLIENT_ID"),
      access_token: token.access_token,
    })) as { user?: { user_id: string | number; email?: string; first_name?: string } };
    if (!info.user) throw new Error("vk: no user");
    return {
      providerUserId: String(info.user.user_id),
      email: info.user.email || null,
      name: info.user.first_name || null,
    };
  },
};

/** Подставной вход: экран /auth/dev-login задаёт идентификатор и почту вручную. */
const dev: Provider = {
  label: "тестовый провайдер",
  configured: devProviderEnabled,
  authorizeUrl: ({ redirectUri, state }) =>
    `/auth/dev-login?${new URLSearchParams({ redirect_uri: redirectUri, state })}`,
  exchange: async ({ query }) => {
    const id = query.get("uid")?.trim();
    if (!id || !/^[\w.-]{1,64}$/.test(id)) throw new Error("dev: bad uid");
    return {
      providerUserId: id,
      email: query.get("email")?.trim() || null,
      name: query.get("name")?.trim() || null,
    };
  },
};

export function devProviderEnabled() {
  return process.env.AUTH_DEV_PROVIDER === "1" && process.env.NODE_ENV !== "production";
}

const PROVIDERS: Record<ProviderId, Provider> = { yandex, vk, dev };

export function getProvider(id: string): Provider | null {
  const provider = PROVIDERS[id as ProviderId];
  return provider && provider.configured() ? provider : null;
}

export function providerOptions() {
  return (Object.keys(PROVIDERS) as ProviderId[]).map((id) => ({
    id,
    label: PROVIDERS[id].label,
    enabled: PROVIDERS[id].configured(),
  }));
}
