import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { config } from "../config.js";
import { SESSION_COOKIE_NAME } from "@max-sncf/shared";
import { signSessionToken } from "../lib/crypto.js";
import { sessionStore } from "../lib/session-store.js";
import { extractXsrfToken } from "../lib/sncf-client.js";

const SNCF_ORIGIN = "https://www.maxactif-tgvinoui.sncf";

export const bridgeRoutes = new Hono()
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
    const PWA = '${config.pwaOrigin}';
    let sncfWindow = null;

    function openSncf() {
      sncfWindow = window.open('${SNCF_ORIGIN}/sncf-connect', 'sncf_login');
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
