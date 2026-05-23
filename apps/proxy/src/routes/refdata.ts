import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { API_PATHS } from "@max-sncf/shared";
import { sncfFetch } from "../lib/sncf-client.js";
import { requireSession } from "../middleware/session.js";

let stationsCache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
const DEFAULT_STATIONS = {
  stations: [
    { code: "FRPNO", label: "PARIS NORD" },
    { code: "FRLLE", label: "LILLE FLANDRES" },
    { code: "FRLIL", label: "LILLE EUROPE" },
    { code: "FRLYS", label: "LYON PART DIEU" },
    { code: "FRMSC", label: "MARSEILLE SAINT-CHARLES" },
    { code: "FRNTE", label: "NANTES" },
    { code: "FRBDX", label: "BORDEAUX SAINT-JEAN" },
    { code: "FRRNS", label: "RENNES" },
  ],
};

// The real SNCF refdata returns `{stations:[{codeStation, station}]}`, but the
// PWA station picker expects `{code, label}`. Normalize so it doesn't crash.
function normalizeStations(body: unknown): {
  stations: Array<{ code: string; label: string }>;
} {
  const raw = (body as { stations?: unknown })?.stations;
  if (!Array.isArray(raw)) return DEFAULT_STATIONS;
  const stations = raw
    .map((s) => {
      const st = s as Record<string, unknown>;
      return {
        code: String(st.code ?? st.codeStation ?? ""),
        label: String(st.label ?? st.station ?? ""),
      };
    })
    .filter((s) => s.code && s.label);
  return stations.length > 0 ? { stations } : DEFAULT_STATIONS;
}

export const refdataRoutes = new Hono()
  .use("/*", requireSession)
  .get("/freeplaces-stations", async (c) => {
    if (stationsCache && Date.now() - stationsCache.timestamp < CACHE_TTL) {
      return c.json(stationsCache.data as Record<string, unknown>);
    }

    const session = c.get("session");
    if (session.imported) {
      return c.json(session.imported.stations ?? DEFAULT_STATIONS);
    }

    const correlationId = c.get("correlationId");

    const result = await sncfFetch(API_PATHS.REFDATA_STATIONS, {
      method: "GET",
      session,
      correlationId,
    });

    if (result.status !== 200) {
      // Never propagate 403/captcha to the client: it would trigger React
      // Query's retry storm at startup AND leave the station picker empty.
      // Serve the last good list (or a sane default) so the picker is instant.
      return c.json(
        (stationsCache?.data as Record<string, unknown>) ?? DEFAULT_STATIONS,
      );
    }

    const normalized = normalizeStations(result.body);
    stationsCache = { data: normalized, timestamp: Date.now() };
    return c.json(normalized);
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
