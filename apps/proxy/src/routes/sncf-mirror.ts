import { Hono } from "hono";
import { SESSION_COOKIE_NAME } from "@max-sncf/shared";
import { config } from "../config.js";
import { signSessionToken } from "../lib/crypto.js";
import { sessionStore } from "../lib/session-store.js";
import { extractXsrfToken, mergeCookies } from "../lib/sncf-client.js";

// ---------------------------------------------------------------------------
// Mobile login via whole-origin reverse-proxy mirror.
//
// The SNCF login can't be done with copy-paste on a phone, and the proxy needs
// the browser's `auth` + `datadome` cookies (bound to the phone's User-Agent)
// to call SNCF server-side. So we serve the SNCF login *through* the proxy on
// dedicated origins (one per SNCF domain), let the user log in there, capture
// the cookies as they stream through, and hand a ready session back to the PWA.
//
// Two origins are mirrored at their ROOT (not a subpath — that broke the SPA
// router and root-relative assets in the earlier /m prototype):
//   - MIRROR_PORT      → https://www.maxactif-tgvinoui.sncf   (app)
//   - MIRROR_IDP_PORT  → https://monidentifiant.sncf          (login form)
// Links between the two are rewritten so the whole flow stays on the mirror.
// ---------------------------------------------------------------------------

const APP_ORIGIN = "https://www.maxactif-tgvinoui.sncf";
// The OAuth login form lives on the auth. subdomain of the identity provider.
const IDP_ORIGIN = "https://auth.monidentifiant.sncf";

export const MIRROR_PORT = parseInt(process.env.MIRROR_PORT || "3344", 10);
export const MIRROR_IDP_PORT = parseInt(process.env.MIRROR_IDP_PORT || "3345", 10);

// Public base the phone uses to reach each mirror.
// In production behind a reverse proxy (Caddy), set MIRROR_APP_BASE and
// MIRROR_IDP_BASE to the public HTTPS URLs. Locally, they default to
// http://<LAN_HOST>:<port> for direct port access.
function hostFromOrigin(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return "localhost";
  }
}
const LAN_HOST = process.env.MIRROR_HOST || hostFromOrigin(config.pwaOrigin);
const APP_BASE = process.env.MIRROR_APP_BASE || `http://${LAN_HOST}:${MIRROR_PORT}`;
const IDP_BASE = process.env.MIRROR_IDP_BASE || `http://${LAN_HOST}:${MIRROR_IDP_PORT}`;

// Server-side capture bucket. Single-user local tool → one global bucket. We
// accumulate every SNCF cookie seen (request Cookie header + response
// Set-Cookie) so the handoff has the freshest auth + datadome.
const bucket = {
  cookies: new Map<string, string>(), // name -> "name=value"
  ua: "",
  hasAuth: false,
  finishToken: "",
};

function rememberCookie(nameValue: string) {
  const nv = nameValue.split(";")[0]?.trim();
  if (!nv) return;
  const eq = nv.indexOf("=");
  if (eq <= 0) return;
  const name = nv.slice(0, eq).trim();
  bucket.cookies.set(name, nv);
  if (name === "auth") bucket.hasAuth = true;
}

// Map every known SNCF/IdP upstream origin to its mirror base. Applied to both
// bodies and redirect Locations so the whole multi-domain login flow — app →
// auth.monidentifiant → back to app with ?code= — stays on the mirror, letting
// us capture the `auth` cookie set on the final app callback.
const ORIGIN_MAP: Array<[string, string]> = [
  ["https://www.maxactif-tgvinoui.sncf", APP_BASE],
  ["https://maxactif-tgvinoui.sncf", APP_BASE],
  ["https://auth.monidentifiant.sncf", IDP_BASE],
  ["https://monidentifiant.sncf", IDP_BASE],
];

function rewriteAll(s: string): string {
  let out = s;
  for (const [origin, base] of ORIGIN_MAP) out = out.replaceAll(origin, base);
  return out;
}

function rewriteBody(body: string, _selfOrigin: string): string {
  return rewriteAll(body);
}

function rewriteLocation(location: string): string {
  return rewriteAll(location);
}

// Rebind cookies for the mirror host. In production (HTTPS), keep Secure flag.
const IS_HTTPS_MIRROR = APP_BASE.startsWith("https://");
function rebindCookie(setCookie: string): string {
  let out = setCookie.replace(/;\s*Domain=[^;]+/gi, "");
  if (!IS_HTTPS_MIRROR) {
    out = out.replace(/;\s*Secure/gi, "");
  }
  return out.replace(/;\s*SameSite=None/gi, "; SameSite=Lax");
}

// A floating "return to the app" button injected into mirrored HTML. Once the
// user has logged in (auth captured), tapping it hands off to /__finish.
function generateFinishToken(): string {
  const token = crypto.randomUUID();
  bucket.finishToken = token;
  return token;
}

function finishWidget(): string {
  return `<div id="__maxsncf_finish" style="position:fixed;left:0;right:0;bottom:0;z-index:2147483647;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:#00214D;display:flex;justify-content:center">
  <a href="/__finish?t=${bucket.finishToken}" style="display:block;width:100%;max-width:420px;text-align:center;padding:14px;border-radius:12px;background:#fff;color:#00214D;font:600 15px -apple-system,system-ui,sans-serif;text-decoration:none">✓ J'ai fini de me connecter — revenir à MAX SNCF</a>
</div>`;
}

function makeMirror(selfOrigin: string) {
  const app = new Hono();

  // Handoff: build a live session from the captured cookies + UA, set the
  // PWA session cookie (host-only → covers all ports on this LAN host), and
  // bounce back to the PWA. Only on the app mirror.
  app.get("/__finish", async (c) => {
    const t = c.req.query("t") ?? "";
    if (!t || t !== bucket.finishToken) {
      return c.html(
        `<body style="font:16px system-ui;padding:24px;color:#991b1b">Token invalide ou expiré. <a href="/sncf-connect">Recommencer</a></body>`,
        403,
      );
    }
    bucket.finishToken = "";
    if (!bucket.hasAuth || bucket.cookies.size === 0) {
      return c.html(
        `<body style="font:16px system-ui;padding:24px;color:#991b1b">Connexion SNCF non détectée. Connectez-vous d'abord, puis réessayez. <a href="/sncf-connect">Retour</a></body>`,
        400,
      );
    }
    const sncfCookies = Array.from(bucket.cookies.values());
    const xsrf = extractXsrfToken(sncfCookies);
    const session = sessionStore.create(sncfCookies, xsrf, bucket.ua || undefined);
    const jwt = await signSessionToken(session.id);
    // Build the Set-Cookie manually and return it on the redirect ourselves:
    // Hono's setCookie() + c.redirect() dropped the Set-Cookie header on this
    // mirror app (verified — the 302 went out with no cookie), so the browser
    // never received the new session and kept a stale one.
    const parts = [
      `${SESSION_COOKIE_NAME}=${jwt}`,
      "Max-Age=86400",
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
    ];
    if (config.cookieDomainAttr) parts.push(`Domain=${config.cookieDomainAttr}`);
    if (config.cookieSecure) parts.push("Secure");
    let redirectTo = config.pwaOrigin;
    try {
      const u = new URL(redirectTo);
      if (u.protocol !== "https:" && u.protocol !== "http:") redirectTo = "/";
    } catch {
      redirectTo = "/";
    }
    return new Response(null, {
      status: 302,
      headers: { Location: redirectTo, "Set-Cookie": parts.join("; ") },
    });
  });

  app.all("/*", async (c) => {
    const reqUrl = new URL(c.req.url);
    if (reqUrl.pathname === "/sncf-connect" && !bucket.finishToken) {
      generateFinishToken();
    }
    const upstreamUrl = `${selfOrigin}${reqUrl.pathname}${reqUrl.search}`;

    const fwd = new Headers();
    // Forward ALL request headers (the SPA's API calls carry x-client-app,
    // x-distribution-channel, x-syg-* etc. — dropping them breaks auth). Strip
    // hop-by-hop / host headers that must not be replayed verbatim.
    const drop = new Set([
      "host",
      "connection",
      "content-length",
      "accept-encoding",
      "origin",
      "referer",
    ]);
    c.req.raw.headers.forEach((value, key) => {
      if (!drop.has(key.toLowerCase())) fwd.set(key, value);
    });
    const ua = c.req.header("user-agent") ?? "";
    if (ua) bucket.ua = ua;
    // DataDome's tag endpoint (/dd/js/) and SNCF backends validate Origin/Referer
    // server-side against the real domain. The browser sends our mirror origin,
    // so rewrite them to the upstream origin on forward.
    fwd.set("Origin", selfOrigin);
    const referer = c.req.header("referer");
    fwd.set(
      "Referer",
      referer
        ? referer.replace(APP_BASE, APP_ORIGIN).replace(IDP_BASE, IDP_ORIGIN)
        : `${selfOrigin}/`,
    );
    const cookie = c.req.header("cookie");
    if (cookie) {
      fwd.set("Cookie", cookie);
      // The browser holds the rebound SNCF cookies and replays them here —
      // capture them (this is where the post-challenge datadome + auth live).
      for (const part of cookie.split(";")) rememberCookie(part);
    }

    // A new login is starting: hitting the IdP login form means we're about to
    // capture a FRESH auth cookie, so clear any stale capture (otherwise the
    // "return to app" button would hand off an expired session).
    if (selfOrigin === IDP_ORIGIN && reqUrl.pathname.includes("/u/login")) {
      bucket.hasAuth = false;
      generateFinishToken();
    }

    const method = c.req.method;
    const body =
      method === "GET" || method === "HEAD" ? undefined : await c.req.arrayBuffer();

    const upstream = await fetch(upstreamUrl, { method, headers: fwd, body, redirect: "manual" });

    const outHeaders = new Headers();
    const ct = upstream.headers.get("content-type") ?? "";
    if (ct) outHeaders.set("content-type", ct);

    const location = upstream.headers.get("location");
    if (location) outHeaders.set("location", rewriteLocation(location));

    for (const sc of upstream.headers.getSetCookie?.() ?? []) {
      rememberCookie(sc);
      outHeaders.append("set-cookie", rebindCookie(sc));
    }

    const isText = /text\/html|javascript|application\/json|text\/css|xml/.test(ct);
    if (isText) {
      let text = rewriteBody(await upstream.text(), selfOrigin);
      // Inject the return-to-app button into the app mirror's HTML once the
      // user is logged in, so the handoff is one tap (no copy-paste). Skip the
      // DataDome JS interstitial (it redirects itself once the challenge passes).
      const isInterstitial = text.includes("geo.captcha-delivery.com");
      if (
        selfOrigin === APP_ORIGIN &&
        ct.includes("text/html") &&
        bucket.hasAuth &&
        !isInterstitial
      ) {
        text = text.replace(/<\/body>/i, `${finishWidget()}</body>`);
      }
      return new Response(text, { status: upstream.status, headers: outHeaders });
    }
    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: outHeaders,
    });
  });

  return app;
}

export const mirrorApp = makeMirror(APP_ORIGIN);
export const mirrorIdpApp = makeMirror(IDP_ORIGIN);

// Exposed for diagnostics.
export function mirrorCaptureState() {
  return { ua: bucket.ua, hasAuth: bucket.hasAuth, cookieNames: Array.from(bucket.cookies.keys()) };
}
