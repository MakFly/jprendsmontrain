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

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
  "Sec-CH-UA": '"Chromium";v="129", "Google Chrome";v="129", "Not=A?Brand";v="8"',
  "Sec-CH-UA-Mobile": "?1",
  "Sec-CH-UA-Platform": '"Android"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  Referer: "https://www.maxactif-tgvinoui.sncf/sncf-connect",
  Origin: "https://www.maxactif-tgvinoui.sncf",
};

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
    ...BROWSER_HEADERS,
  });

  const cookieParts: string[] = [...dataDomeCookies];

  if (options.session) {
    headers.set(SNCF_HEADERS.CLIENT_AUTH, "true");
    headers.set(SNCF_HEADERS.XSRF_TOKEN, options.session.xsrfToken);
    cookieParts.push(...options.session.sncfCookies);
  }

  if (cookieParts.length > 0) {
    const cookieValues = cookieParts.map((c) => {
      const nv = c.split(";")[0];
      return nv?.trim() ?? "";
    }).filter(Boolean);
    headers.set("Cookie", cookieValues.join("; "));
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
