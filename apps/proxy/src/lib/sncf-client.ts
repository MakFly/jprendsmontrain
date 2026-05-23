import {
  CLIENT_APP,
  DISTRIBUTION_CHANNEL,
  SNCF_HEADERS,
  XSRF_COOKIE_NAME,
} from "@max-sncf/shared";
import { config } from "../config.js";
import type { SessionData } from "./session-store.js";

export interface SncfResponse {
  status: number;
  headers: Headers;
  body: unknown;
  setCookies: string[];
  isCaptcha: boolean;
  captchaUrl?: string;
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

/**
 * DataDome binds its cookie to the User-Agent it was issued for. A live
 * session captured from a real browser carries that browser's UA; we MUST
 * replay it (and consistent Client Hints) or DataDome returns a 403 captcha
 * even with a valid `datadome` cookie.
 */
function browserHeaders(userAgent?: string): Record<string, string> {
  const ua = userAgent || DEFAULT_USER_AGENT;
  const headers: Record<string, string> = {
    "User-Agent": ua,
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Accept-Language": "fr-FR,fr;q=0.9",
    Referer: "https://www.maxactif-tgvinoui.sncf/sncf-connect/mes-voyages",
    Origin: "https://www.maxactif-tgvinoui.sncf",
  };

  // Sec-CH-UA* (Client Hints) are a Chromium-on-desktop/Android feature. iOS
  // browsers — Safari AND Chrome/CriOS, both WebKit — send NONE of them. Pairing
  // desktop-Chrome hints (and a "Linux" platform!) with an iPhone UA is an
  // obvious spoof signal that made DataDome 403/captcha every iOS session while
  // Mac sessions passed. So only emit hints for a genuine Chromium UA, never iOS.
  const isIOS = /iPhone|iPad|iPod|CriOS|FxiOS|EdgiOS/.test(ua);
  const chromeMajor = ua.match(/Chrome\/(\d+)/)?.[1];
  if (!isIOS && chromeMajor) {
    const platform = ua.includes("Macintosh")
      ? "macOS"
      : ua.includes("Windows")
        ? "Windows"
        : ua.includes("Android")
          ? "Android"
          : "Linux";
    headers["Sec-CH-UA"] =
      `"Chromium";v="${chromeMajor}", "Google Chrome";v="${chromeMajor}", "Not/A)Brand";v="99"`;
    headers["Sec-CH-UA-Mobile"] = ua.includes("Mobile") ? "?1" : "?0";
    headers["Sec-CH-UA-Platform"] = `"${platform}"`;
  }

  return headers;
}

let dataDomeCookies: string[] = [];

export function setDataDomeCookies(cookies: string[]): void {
  dataDomeCookies = cookies;
}

export function getDataDomeCookies(): string[] {
  return dataDomeCookies;
}

export async function sncfFetch(
  path: string,
  options: {
    method: "GET" | "POST";
    body?: unknown;
    session?: SessionData | null;
    correlationId: string;
  },
): Promise<SncfResponse> {
  const url = `${config.sncfBackendUrl}${path}`;

  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
    [SNCF_HEADERS.CLIENT_APP]: CLIENT_APP,
    [SNCF_HEADERS.CLIENT_APP_VERSION]: config.appVersion,
    [SNCF_HEADERS.DISTRIBUTION_CHANNEL]: DISTRIBUTION_CHANNEL,
    [SNCF_HEADERS.CORRELATION_ID]: options.correlationId,
    ...browserHeaders(options.session?.userAgent),
  });

  // Global DataDome cookies seed the pre-auth flow. Session cookies come last
  // so that a live session's own `datadome`/`auth` win over any globally
  // captured (possibly captcha-tainted) value during de-duplication.
  const cookieParts: string[] = [...dataDomeCookies];

  if (options.session) {
    headers.set(SNCF_HEADERS.CLIENT_AUTH, "true");
    // The live web app does not send X-XSRF-TOKEN; only set it if we actually
    // captured one (legacy flow). Auth is carried by the `auth` cookie.
    if (options.session.xsrfToken) {
      headers.set(SNCF_HEADERS.XSRF_TOKEN, options.session.xsrfToken);
    }
    cookieParts.push(...options.session.sncfCookies);
  }

  if (cookieParts.length > 0) {
    // De-duplicate by cookie name, last value wins (session over global).
    const byName = new Map<string, string>();
    for (const c of cookieParts) {
      const nv = c.split(";")[0]?.trim();
      if (!nv) continue;
      const eq = nv.indexOf("=");
      if (eq <= 0) continue;
      byName.set(nv.slice(0, eq).trim(), nv);
    }
    if (byName.size > 0) {
      headers.set("Cookie", Array.from(byName.values()).join("; "));
    }
  }

  const response = await fetch(url, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    redirect: "manual",
  });

  const setCookies = response.headers.getSetCookie?.() ?? [];

  // Capture DataDome cookies from responses
  for (const cookie of setCookies) {
    const name = cookie.split("=")[0]?.trim();
    if (name?.startsWith("datadome")) {
      dataDomeCookies = mergeCookies(dataDomeCookies, [cookie]);
    }
  }

  let body: unknown;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.arrayBuffer();
  }

  // Detect DataDome captcha
  let isCaptcha = false;
  let captchaUrl: string | undefined;
  if (response.status === 403 && typeof body === "object" && body !== null) {
    const obj = body as Record<string, unknown>;
    if (typeof obj.url === "string" && obj.url.includes("captcha")) {
      isCaptcha = true;
      captchaUrl = obj.url;
    }
  }

  return {
    status: response.status,
    headers: response.headers,
    body,
    setCookies,
    isCaptcha,
    captchaUrl,
  };
}

export function extractXsrfToken(cookies: string[]): string {
  for (const cookie of cookies) {
    const parts = cookie.split(";")[0];
    if (parts) {
      const [name, value] = parts.split("=");
      if (name?.trim() === XSRF_COOKIE_NAME && value) {
        return decodeURIComponent(value.trim());
      }
    }
  }
  return "";
}

export function mergeCookies(
  existing: string[],
  incoming: string[],
): string[] {
  const cookieMap = new Map<string, string>();

  for (const cookie of [...existing, ...incoming]) {
    const nameValue = cookie.split(";")[0];
    if (nameValue) {
      const eqIndex = nameValue.indexOf("=");
      if (eqIndex > 0) {
        const name = nameValue.substring(0, eqIndex).trim();
        cookieMap.set(name, cookie);
      }
    }
  }

  return Array.from(cookieMap.values());
}
