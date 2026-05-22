import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { sncfFetch, mergeCookies } from "./sncf-client.js";
import { sessionStore } from "./session-store.js";

function updateSessionCookies(
  sessionId: string,
  existing: string[],
  incoming: string[],
) {
  if (incoming.length > 0) {
    const merged = mergeCookies(existing, incoming);
    sessionStore.update(sessionId, { sncfCookies: merged });
  }
}

export async function proxyPost(c: Context, sncfPath: string) {
  const session = c.get("session");
  const correlationId = c.get("correlationId");
  const body = await c.req.json().catch(() => ({}));

  const result = await sncfFetch(sncfPath, {
    method: "POST",
    body,
    session,
    correlationId,
  });

  updateSessionCookies(session.id, session.sncfCookies, result.setCookies);

  if (result.isCaptcha) {
    return c.json(
      { error: "CAPTCHA_REQUIRED", captchaUrl: result.captchaUrl },
      200,
    );
  }

  return c.json(
    result.body as Record<string, unknown>,
    result.status as ContentfulStatusCode,
  );
}

export async function proxyGet(c: Context, sncfPath: string) {
  const session = c.get("session");
  const correlationId = c.get("correlationId");

  const query = c.req.query();
  const qs = new URLSearchParams(query).toString();
  const fullPath = qs ? `${sncfPath}?${qs}` : sncfPath;

  const result = await sncfFetch(fullPath, {
    method: "GET",
    session,
    correlationId,
  });

  updateSessionCookies(session.id, session.sncfCookies, result.setCookies);

  if (result.isCaptcha) {
    return c.json(
      { error: "CAPTCHA_REQUIRED", captchaUrl: result.captchaUrl },
      200,
    );
  }

  if (result.body instanceof ArrayBuffer) {
    const contentType =
      result.headers.get("content-type") ?? "application/octet-stream";
    return new Response(result.body, {
      status: result.status,
      headers: { "Content-Type": contentType },
    });
  }

  return c.json(
    result.body as Record<string, unknown>,
    result.status as ContentfulStatusCode,
  );
}
