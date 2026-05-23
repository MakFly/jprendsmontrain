import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  API_PATHS,
  SESSION_COOKIE_NAME,
  type AuthInitResponse,
  type AuthCallbackResponse,
  type AuthLogoutResponse,
} from "@max-sncf/shared";
import { config } from "../config.js";
import { signSessionToken, verifySessionToken } from "../lib/crypto.js";
import { sessionStore } from "../lib/session-store.js";
import {
  sncfFetch,
  extractXsrfToken,
  mergeCookies,
  setDataDomeCookies,
} from "../lib/sncf-client.js";
import { requireSession } from "../middleware/session.js";

const callbackSchema = z.object({
  code: z.string().min(1),
});

const dataDomeSchema = z.object({
  cookies: z.array(z.string()).min(1),
});

export const authRoutes = new Hono()
  .get("/init", async (c) => {
    const correlationId = c.get("correlationId");

    const result = await sncfFetch(API_PATHS.AUTH_INIT, {
      method: "GET",
      correlationId,
    });

    if (result.isCaptcha) {
      return c.json({
        error: "CAPTCHA_REQUIRED",
        captchaUrl: result.captchaUrl,
        message: "DataDome captcha required. Solve it and POST cookies to /auth/datadome",
      });
    }

    if (result.status !== 200) {
      return c.json(
        { error: "SNCF_ERROR", message: "Failed to init auth", upstream: result.body },
        502,
      );
    }

    const data = result.body as AuthInitResponse;

    return c.json({
      redirectToConnectUri: data.redirectToConnectUri,
      redirectToCreateUri: data.redirectToCreateUri,
    });
  })

  .post("/datadome", zValidator("json", dataDomeSchema), async (c) => {
    const { cookies } = c.req.valid("json");
    setDataDomeCookies(cookies);
    return c.json({ success: true, message: "DataDome cookies stored. Retry /auth/init." });
  })

  .post("/callback", zValidator("json", callbackSchema), async (c) => {
    const { code } = c.req.valid("json");
    const correlationId = c.get("correlationId");

    const result = await sncfFetch(API_PATHS.AUTH_CALLBACK, {
      method: "POST",
      body: { code },
      correlationId,
    });

    if (result.isCaptcha) {
      return c.json({
        error: "CAPTCHA_REQUIRED",
        captchaUrl: result.captchaUrl,
      });
    }

    if (result.status !== 200) {
      return c.json(
        { error: "AUTH_FAILED", message: "Callback failed", upstream: result.body },
        401,
      );
    }

    const data = result.body as AuthCallbackResponse;
    if (!data.success) {
      return c.json({ error: "AUTH_FAILED", message: "Auth not successful" }, 401);
    }

    const sncfCookies = result.setCookies;
    const xsrfToken = extractXsrfToken(sncfCookies);

    const session = sessionStore.create(sncfCookies, xsrfToken);
    const jwt = await signSessionToken(session.id);

    setCookie(c, SESSION_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: "Lax",
      domain: config.cookieDomainAttr,
      path: "/",
      maxAge: 86400,
    });

    return c.json({ success: true });
  })

  .post("/refresh", requireSession, async (c) => {
    const session = c.get("session");
    const correlationId = c.get("correlationId");

    if (session.imported) {
      sessionStore.touch(session.id);
      return c.json({ success: true, mode: "imported" });
    }

    const result = await sncfFetch(API_PATHS.AUTH_REFRESH, {
      method: "POST",
      session,
      correlationId,
    });

    if (result.status !== 200) {
      // A failed refresh must NOT destroy the session: the existing `auth`
      // cookie may still be valid for data calls (and DataDome can 403 the
      // refresh endpoint server-side even when the session is fine). Keep the
      // session alive; real invalidity surfaces as 401s on actual data calls.
      sessionStore.touch(session.id);
      return c.json({ success: true, mode: "live", refreshed: false });
    }

    if (result.setCookies.length > 0) {
      const merged = mergeCookies(session.sncfCookies, result.setCookies);
      const newXsrf = extractXsrfToken(result.setCookies) || session.xsrfToken;
      sessionStore.update(session.id, {
        sncfCookies: merged,
        xsrfToken: newXsrf,
      });
    }
    sessionStore.touch(session.id);

    return c.json({ success: true, mode: "live" });
  })

  .get("/logout", requireSession, async (c) => {
    const session = c.get("session");
    const correlationId = c.get("correlationId");

    const result = await sncfFetch(API_PATHS.AUTH_LOGOUT, {
      method: "GET",
      session,
      correlationId,
    });

    sessionStore.destroy(session.id);
    deleteCookie(c, SESSION_COOKIE_NAME);

    const data = result.body as AuthLogoutResponse;
    return c.json({
      redirectLogoutSession: data?.redirectLogoutSession ?? null,
    });
  })

  .get("/status", async (c) => {
    const token = getCookie(c, SESSION_COOKIE_NAME);
    if (!token) {
      return c.json({ authenticated: false });
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return c.json({ authenticated: false });
    }

    const session = sessionStore.get(payload.sid);
    return c.json({
      authenticated: !!session,
      mode: session?.imported ? "imported" : session ? "live" : undefined,
      expiresAt: session?.expiresAt,
    });
  });
