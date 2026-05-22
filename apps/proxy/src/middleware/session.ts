import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { SESSION_COOKIE_NAME } from "@max-sncf/shared";
import { verifySessionToken } from "../lib/crypto.js";
import { sessionStore, type SessionData } from "../lib/session-store.js";

declare module "hono" {
  interface ContextVariableMap {
    session: SessionData;
    correlationId: string;
  }
}

export const requireSession: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (!token) {
    return c.json({ error: "UNAUTHORIZED", message: "No session" }, 401);
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return c.json({ error: "UNAUTHORIZED", message: "Invalid session token" }, 401);
  }

  const session = sessionStore.get(payload.sid);
  if (!session) {
    return c.json({ error: "UNAUTHORIZED", message: "Session expired" }, 401);
  }

  c.set("session", session);
  await next();
};
