import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { API_PATHS } from "@max-sncf/shared";
import { sncfFetch } from "../lib/sncf-client.js";
import { requireSession } from "../middleware/session.js";

let stationsCache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

export const refdataRoutes = new Hono()
  .use("/*", requireSession)
  .get("/freeplaces-stations", async (c) => {
    if (stationsCache && Date.now() - stationsCache.timestamp < CACHE_TTL) {
      return c.json(stationsCache.data as Record<string, unknown>);
    }

    const session = c.get("session");
    const correlationId = c.get("correlationId");

    const result = await sncfFetch(API_PATHS.REFDATA_STATIONS, {
      method: "GET",
      session,
      correlationId,
    });

    if (result.status === 200) {
      stationsCache = { data: result.body, timestamp: Date.now() };
    }

    return c.json(
      result.body as Record<string, unknown>,
      result.status as ContentfulStatusCode,
    );
  })

  .post("/search-freeplaces-proposals", async (c) => {
    const session = c.get("session");
    const correlationId = c.get("correlationId");
    const body = await c.req.json().catch(() => ({}));

    const result = await sncfFetch(API_PATHS.REFDATA_SEARCH_PROPOSALS, {
      method: "POST",
      body,
      session,
      correlationId,
    });

    return c.json(
      result.body as Record<string, unknown>,
      result.status as ContentfulStatusCode,
    );
  });
