import { SNCF_BACKEND_URL } from "@max-sncf/shared";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const cookieDomain = process.env.COOKIE_DOMAIN || "localhost";
// Browsers reject a cookie Domain attribute set to a bare IP (or "none"); such
// hosts must use a host-only cookie (no Domain attr). This matters for LAN/phone
// testing where the app is reached at http://<ip>:<port>.
const isIpHost = /^\d{1,3}(\.\d{1,3}){3}$/.test(cookieDomain);
const hostOnlyCookie = cookieDomain === "none" || isIpHost;

export const config = {
  port: parseInt(process.env.PORT || "3333", 10),
  sncfBackendUrl: process.env.SNCF_BACKEND_URL || SNCF_BACKEND_URL,
  pwaOrigin: process.env.PWA_ORIGIN || "http://localhost:3000",
  // Comma-separated allowlist of browser origins permitted by CORS. Falls back
  // to PWA_ORIGIN. Add the LAN origin (http://<ip>:3020) for phone testing.
  pwaOrigins: (process.env.PWA_ORIGINS || process.env.PWA_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  sessionSecret: required("SESSION_SECRET"),
  cookieDomain,
  // undefined => host-only cookie (no Domain attribute).
  cookieDomainAttr: hostOnlyCookie ? undefined : cookieDomain,
  // Secure cookies require HTTPS; over plain-HTTP LAN testing they must be off
  // or the browser silently drops them. Default: secure unless localhost/host-only.
  cookieSecure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE.toLowerCase() === "true"
      : cookieDomain !== "localhost" && !hostOnlyCookie,
  appVersion: process.env.APP_VERSION || "2.54.2",
} as const;
