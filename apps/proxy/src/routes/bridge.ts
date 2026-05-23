import { Hono, type Context, type MiddlewareHandler } from "hono";
import { Buffer } from "node:buffer";
import { getCookie, setCookie } from "hono/cookie";
import { config } from "../config.js";
import { SESSION_COOKIE_NAME } from "@max-sncf/shared";
import { signSessionToken, verifySessionToken } from "../lib/crypto.js";
import { sessionStore, type ImportedSessionData } from "../lib/session-store.js";
import { extractXsrfToken } from "../lib/sncf-client.js";

const SNCF_ORIGIN = "https://www.maxactif-tgvinoui.sncf";

function escapeJS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/</g, "\\x3c").replace(/>/g, "\\x3e");
}

const BRIDGE_SECRET = process.env.BRIDGE_SECRET || "";

const requireBridgeAuth: MiddlewareHandler = async (c, next) => {
  if (!BRIDGE_SECRET) return await next();
  const auth = c.req.header("authorization");
  if (auth === `Bearer ${BRIDGE_SECRET}`) return await next();
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload && sessionStore.get(payload.sid)) return await next();
  }
  return c.json({ error: "FORBIDDEN", message: "Bridge auth required" }, 403);
};

// ---------------------------------------------------------------------------
// Device pairing: copy an existing live session onto another device (the phone)
// without re-logging-in there. The source device (already authenticated) mints
// a short-lived one-time code; the phone opens /bridge/pair?code=… (e.g. via a
// QR), which signs a fresh session cookie for the SAME server-side session and
// redirects into the PWA. Sessions are server-side, so several devices can
// safely share one sid for a personal account.
// ---------------------------------------------------------------------------
const pairCodes = new Map<string, { sid: string; exp: number }>();
function newPairCode(sid: string): string {
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  pairCodes.set(code, { sid, exp: Date.now() + 5 * 60_000 });
  return code;
}

async function createImportedSession(c: Context, imported: ImportedSessionData) {
  const session = sessionStore.createImported({
    ...imported,
    source: "browser",
    importedAt: new Date().toISOString(),
  });
  const jwt = await signSessionToken(session.id);

  setCookie(c, SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "Lax",
    domain: config.cookieDomainAttr,
    path: "/",
    maxAge: 86400,
  });

  return c.redirect(config.pwaOrigin);
}

interface LiveSessionPayload {
  cookies: Record<string, string> | string[];
  userAgent?: string;
  cardNumber?: string;
}

function toCookieArray(cookies: Record<string, string> | string[]): string[] {
  if (Array.isArray(cookies)) return cookies.filter(Boolean);
  return Object.entries(cookies)
    .filter(([, v]) => Boolean(v))
    .map(([name, value]) => `${name}=${value}`);
}

export const bridgeRoutes = new Hono()
  // Create a LIVE session from cookies harvested in a real browser
  // (auth + datadome) plus the exact User-Agent the datadome cookie was issued
  // for. This is the only way to make authenticated/mutating SNCF calls
  // (book / exchange / cancel) work server-side past DataDome.
  .post("/session", requireBridgeAuth, async (c) => {
    const payload = (await c.req.json().catch(() => null)) as LiveSessionPayload | null;
    if (!payload?.cookies) {
      return c.json({ error: "MISSING_COOKIES" }, 400);
    }

    const sncfCookies = toCookieArray(payload.cookies);
    const hasAuth = sncfCookies.some((ck) => ck.startsWith("auth="));
    const hasDatadome = sncfCookies.some((ck) => ck.startsWith("datadome="));
    if (!hasAuth || !hasDatadome) {
      return c.json(
        { error: "INCOMPLETE_SESSION", message: "Both `auth` and `datadome` cookies are required." },
        400,
      );
    }

    const xsrfToken = extractXsrfToken(sncfCookies);
    const session = sessionStore.create(sncfCookies, xsrfToken, payload.userAgent);
    // Cache the card number up front (the harvesting client knows it) so the
    // proxy never needs an extra read-customer round-trip — fewer requests means
    // less chance of tripping DataDome's burst detection.
    if (payload.cardNumber) {
      sessionStore.update(session.id, { cardNumber: payload.cardNumber });
    }
    const jwt = await signSessionToken(session.id);

    setCookie(c, SESSION_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: "Lax",
      domain: config.cookieDomainAttr,
      path: "/",
      maxAge: 86400,
    });

    return c.json({ success: true, mode: "live" });
  })

  // Source device (authenticated): mint a one-time pairing code for the phone.
  .get("/pair-start", async (c) => {
    const token = getCookie(c, SESSION_COOKIE_NAME);
    const payload = token ? await verifySessionToken(token) : null;
    const session = payload ? sessionStore.get(payload.sid) : null;
    if (!session) return c.json({ error: "NO_SESSION" }, 401);
    const code = newPairCode(session.id);
    const pairUrl = `${new URL(c.req.url).origin}/bridge/pair?code=${code}`;
    return c.json({ code, pairUrl, expiresInSec: 300 });
  })

  // Target device (the phone): redeem the code → session cookie → into the PWA.
  .get("/pair", async (c) => {
    const code = c.req.query("code")?.toUpperCase() ?? "";
    const entry = pairCodes.get(code);
    if (!entry || entry.exp < Date.now()) {
      pairCodes.delete(code);
      return c.html(
        `<body style="font:16px system-ui;padding:24px;color:#991b1b">Code d'appairage invalide ou expiré.</body>`,
        400,
      );
    }
    pairCodes.delete(code); // one-time use
    const session = sessionStore.get(entry.sid);
    if (!session) {
      return c.html(
        `<body style="font:16px system-ui;padding:24px;color:#991b1b">Session source expirée. Reconnectez-vous sur l'appareil d'origine.</body>`,
        410,
      );
    }
    const jwt = await signSessionToken(session.id);
    setCookie(c, SESSION_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: "Lax",
      domain: config.cookieDomainAttr,
      path: "/",
      maxAge: 86400,
    });
    return c.redirect(config.pwaOrigin);
  })

  .get("/import", requireBridgeAuth, async (c) => {
    const payload = c.req.query("payload");
    if (payload) {
      try {
        const parsed = JSON.parse(
          Buffer.from(payload, "base64url").toString("utf8"),
        ) as ImportedSessionData;
        return createImportedSession(c, parsed);
      } catch {
        return c.text("Invalid import payload", 400);
      }
    }

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>MAX SNCF — Import navigateur</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 1.5rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #0f172a; }
    main { width: min(100%, 32rem); background: white; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 10px 30px rgba(15,23,42,0.08); }
    h1 { margin: 0 0 0.375rem; color: #00214D; font-size: 1.25rem; }
    p { margin: 0 0 1rem; color: #475569; line-height: 1.45; }
    label { display: block; margin-bottom: 0.375rem; font-size: 0.8125rem; font-weight: 700; color: #334155; }
    textarea { width: 100%; min-height: 14rem; resize: vertical; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 0.75rem; font: 0.8125rem ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    button { width: 100%; min-height: 44px; margin-top: 0.875rem; border: 0; border-radius: 0.5rem; background: #00214D; color: white; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <main>
    <h1>Import navigateur MAX SNCF</h1>
    <p>Collez les donnees extraites depuis votre session SNCF deja connectee. Le proxy creera une session locale PWA sans stocker vos identifiants.</p>
    <form method="post" action="/bridge/import">
      <label for="payload">Donnees de session</label>
      <textarea id="payload" name="payload" required autofocus></textarea>
      <button type="submit">Connecter la PWA</button>
    </form>
  </main>
</body>
</html>`;

    return c.html(html);
  })

  .post("/import", requireBridgeAuth, async (c) => {
    const body = await c.req.parseBody();
    const raw = body.payload;

    if (typeof raw !== "string" || raw.trim().length === 0) {
      return c.text("Payload missing", 400);
    }

    let parsed: ImportedSessionData;
    try {
      parsed = JSON.parse(raw) as ImportedSessionData;
    } catch {
      return c.text("Payload must be valid JSON", 400);
    }

    return createImportedSession(c, parsed);
  })

  .get("/login", (c) => {
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>MAX SNCF — Connexion</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f4f8; min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem; color: #1e293b; }
    .card { background: white; border-radius: 1rem; padding: 2rem; max-width: 26rem; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .logo { width: 4rem; height: 4rem; background: #00214D; border-radius: 1rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
    .logo svg { width: 2rem; height: 2rem; fill: white; }
    h1 { font-size: 1.5rem; color: #00214D; text-align: center; }
    .sub { color: #64748B; font-size: 0.875rem; text-align: center; margin: 0.25rem 0 1.5rem; }
    .steps { list-style: none; counter-reset: step; margin-bottom: 1.5rem; }
    .steps li { counter-increment: step; padding: 0.625rem 0.75rem; background: #f8fafc; border-radius: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8125rem; line-height: 1.4; }
    .steps li::before { content: counter(step) ". "; font-weight: 700; color: #00214D; }
    .btn { display: flex; align-items: center; justify-content: center; width: 100%; padding: 0.875rem; border: none; border-radius: 0.75rem; font-size: 0.9375rem; font-weight: 600; cursor: pointer; min-height: 44px; gap: 0.5rem; transition: opacity 0.15s; }
    .btn:hover { opacity: 0.9; }
    .btn-primary { background: #00214D; color: white; }
    .btn-outline { background: white; color: #00214D; border: 1.5px solid #e2e8f0; margin-top: 0.5rem; }
    .input-group { margin-top: 1.25rem; }
    .input-group label { display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 0.375rem; }
    .input-group input { width: 100%; padding: 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem; min-height: 44px; font-family: inherit; }
    .input-group input:focus { outline: none; border-color: #00214D; box-shadow: 0 0 0 3px rgba(0,33,77,0.08); }
    #status { margin-top: 0.75rem; padding: 0.625rem 0.75rem; border-radius: 0.5rem; font-size: 0.8125rem; display: none; }
    #status.show { display: block; }
    #status.info { background: #eff6ff; color: #1e40af; }
    #status.success { background: #f0fdf4; color: #166534; }
    #status.error { background: #fef2f2; color: #991b1b; }
    .hidden { display: none !important; }
    .spinner { width: 1.25rem; height: 1.25rem; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
    </div>
    <h1>MAX SNCF</h1>
    <p class="sub">Connexion securisee via le site officiel SNCF</p>

    <div id="step1">
      <ol class="steps">
        <li>Cliquez sur <b>Ouvrir le site SNCF</b> (nouvel onglet)</li>
        <li>Connectez-vous avec vos identifiants SNCF</li>
        <li>Apres connexion, revenez ici et cliquez <b>J'ai termine</b></li>
      </ol>
      <button class="btn btn-primary" onclick="openSncf()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Ouvrir le site SNCF
      </button>
    </div>

    <div id="step2" class="hidden">
      <p style="font-size:0.8125rem;color:#475569;margin-bottom:1rem;">
        Apres vous etre connecte sur le site SNCF, collez l'URL de la page ici.
        Elle ressemble a :<br>
        <code style="font-size:0.75rem;background:#f1f5f9;padding:0.125rem 0.375rem;border-radius:0.25rem;word-break:break-all;">
          https://www.maxactif-tgvinoui.sncf/auth/login/redirect?code=xxx
        </code>
      </p>
      <div class="input-group" style="margin-top:0">
        <label>URL apres connexion</label>
        <input type="text" id="codeInput" placeholder="Collez l'URL ici..." autofocus>
      </div>
      <button class="btn btn-primary" onclick="submitCode()" style="margin-top:0.75rem" id="submitBtn">
        Valider la connexion
      </button>
      <button class="btn btn-outline" onclick="openSncf()">
        Reouvrir le site SNCF
      </button>
    </div>

    <div id="status"></div>
  </div>

  <script>
    const PWA = '${escapeJS(config.pwaOrigin)}';
    let sncfWindow = null;

    function openSncf() {
      sncfWindow = window.open('${escapeJS(SNCF_ORIGIN)}/sncf-connect', 'sncf_login');
      document.getElementById('step1').classList.add('hidden');
      document.getElementById('step2').classList.remove('hidden');
      setStatus('Connectez-vous sur le site SNCF puis revenez ici.', 'info');
    }

    function setStatus(msg, cls) {
      const el = document.getElementById('status');
      el.innerHTML = msg;
      el.className = 'show ' + cls;
    }

    async function submitCode() {
      const raw = document.getElementById('codeInput').value.trim();
      let code = raw;

      try {
        const url = new URL(raw);
        code = url.searchParams.get('code') || raw;
      } catch {}

      if (!code) {
        setStatus('Veuillez coller l\\'URL de la page apres connexion.', 'error');
        return;
      }

      const btn = document.getElementById('submitBtn');
      btn.innerHTML = '<div class="spinner"></div> Connexion...';
      btn.disabled = true;

      try {
        const res = await fetch('/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code })
        });
        const data = await res.json();

        if (data.success) {
          setStatus('&#10003; Connecte ! Redirection vers MAX SNCF...', 'success');
          if (sncfWindow && !sncfWindow.closed) sncfWindow.close();
          setTimeout(() => { window.location.href = PWA; }, 800);
        } else {
          const msg = data.message || 'Code invalide ou expire.';
          setStatus(msg + '<br><small>Reconnectez-vous sur le site SNCF et reessayez.</small>', 'error');
          btn.innerHTML = 'Valider la connexion';
          btn.disabled = false;
        }
      } catch (err) {
        setStatus('Erreur reseau : ' + err.message, 'error');
        btn.innerHTML = 'Valider la connexion';
        btn.disabled = false;
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !document.getElementById('step2').classList.contains('hidden')) {
        submitCode();
      }
    });

    // Auto-detect code in URL
    const p = new URLSearchParams(window.location.search);
    if (p.get('code')) {
      document.getElementById('step1').classList.add('hidden');
      document.getElementById('step2').classList.remove('hidden');
      document.getElementById('codeInput').value = p.get('code');
      submitCode();
    }
  </script>
</body>
</html>`;

    return c.html(html);
  });
