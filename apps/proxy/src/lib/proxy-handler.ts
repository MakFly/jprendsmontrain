import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { API_PATHS } from "@max-sncf/shared";
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

const DEFAULT_STATIONS = [
  { code: "FRPNO", label: "PARIS NORD" },
  { code: "FRLLE", label: "LILLE FLANDRES" },
  { code: "FRLIL", label: "LILLE EUROPE" },
  { code: "FRLYS", label: "LYON PART DIEU" },
  { code: "FRMSC", label: "MARSEILLE SAINT-CHARLES" },
  { code: "FRNTE", label: "NANTES" },
  { code: "FRBDX", label: "BORDEAUX SAINT-JEAN" },
  { code: "FRRNS", label: "RENNES" },
] as const;

function stationLabel(code: unknown): string {
  const found = DEFAULT_STATIONS.find((station) => station.code === code);
  return found?.label ?? String(code || "Gare");
}

function buildTravel(body: Record<string, unknown>, index: number) {
  const date = String(body.departureDate || new Date().toISOString().slice(0, 10));
  const preferredTime = String(body.preferredTime || "");
  const preferredMatch = preferredTime.match(/(\d{1,2})h?(\d{2})?/);
  const preferredHour = preferredMatch?.[1]
    ? Number.parseInt(preferredMatch[1], 10)
    : 6;
  const preferredMinute = preferredMatch?.[2]
    ? Number.parseInt(preferredMatch[2], 10)
    : 0;
  const minutesOffset = index * 23;
  const departureDate = new Date(
    `${date}T${String(preferredHour).padStart(2, "0")}:${String(
      preferredMinute,
    ).padStart(2, "0")}:00`,
  );
  departureDate.setMinutes(departureDate.getMinutes() + minutesOffset);
  const arrivalDate = new Date(departureDate.getTime() + 62 * 60 * 1000);
  const origin = String(body.origin || "FRLLE");
  const destination = String(body.destination || "FRPNO");

  return {
    id: `local-${date}-${origin}-${destination}-${index + 1}`,
    departureStation: { code: origin, label: stationLabel(origin) },
    arrivalStation: { code: destination, label: stationLabel(destination) },
    departureDateTime: departureDate.toISOString(),
    arrivalDateTime: arrivalDate.toISOString(),
    duration: "1h02",
    trainNumber: String(7000 + index * 17),
    carrier: "TGV INOUI",
    status: index === 2 ? "WAITLIST" : "AVAILABLE",
    segments: [],
  };
}

// SNCF endpoints that require the MAX card number in the request body. The PWA
// doesn't know it, so the proxy injects it from the live session (cached).
const CARD_NUMBER_PATHS = new Set<string>([
  API_PATHS.SUBSCRIPTION_SUMMARY,
  API_PATHS.SUBSCRIPTION_QRCODE,
  API_PATHS.RESERVATION_CONSULTATION,
  API_PATHS.RESERVATION_PREFERENCES_READ,
  API_PATHS.RESERVATION_PREFERENCES_UPDATE,
]);

async function ensureCardNumber(
  session: NonNullable<ReturnType<typeof sessionStore.get>>,
  correlationId: string,
): Promise<string | undefined> {
  if (session.cardNumber) return session.cardNumber;
  // The `cards` array is only returned by the GET form with the productTypes
  // query — the POST form (used elsewhere) omits it. Verified live 2026-05-22:
  // GET read-customer?productTypes=FIDEL,NF,FF → cards[0].cardNumber.
  const res = await sncfFetch(
    `${API_PATHS.CUSTOMER_READ}?productTypes=FIDEL,NF,FF`,
    { method: "GET", session, correlationId },
  );
  const body = res.body as {
    cards?: Array<{ cardNumber?: string }>;
    lastName?: string;
  };
  const cardNumber = Array.isArray(body?.cards) ? body.cards[0]?.cardNumber : undefined;
  if (cardNumber) {
    sessionStore.update(session.id, { cardNumber });
    session.cardNumber = cardNumber;
  }
  if (body?.lastName) {
    sessionStore.update(session.id, { customerName: body.lastName });
    session.customerName = body.lastName;
  }
  return cardNumber;
}

// Customer last name, required by get-travel / cancel-reservation.
async function ensureCustomerName(
  session: SessionLike,
  correlationId: string,
): Promise<string | undefined> {
  if (session.customerName) return session.customerName;
  const res = await sncfFetch(API_PATHS.CUSTOMER_READ, {
    method: "POST",
    body: {},
    session,
    correlationId,
  });
  const lastName = (res.body as { lastName?: string })?.lastName;
  if (lastName) {
    sessionStore.update(session.id, { customerName: lastName });
    session.customerName = lastName;
  }
  return lastName;
}

function sncfRequestBody(sncfPath: string, body: Record<string, unknown>) {
  if (sncfPath !== API_PATHS.RESERVATION_SEARCH) return body;
  const { preferredTime, preferenceDay, direction, ...sncfBody } = body;
  void preferredTime;
  void preferenceDay;
  void direction;
  return sncfBody;
}

function getTravels(data: Record<string, unknown> | undefined) {
  return ((data?.travels ?? []) as Array<Record<string, unknown>>).filter(Boolean);
}

function updateImported(
  session: NonNullable<ReturnType<typeof sessionStore.get>>,
  patch: Record<string, unknown>,
) {
  if (!session.imported) return;
  sessionStore.update(session.id, {
    imported: {
      ...session.imported,
      ...patch,
      importedAt: new Date().toISOString(),
    },
  });
}

function importedResponse(
  session: ReturnType<typeof sessionStore.get>,
  sncfPath: string,
  body: Record<string, unknown> = {},
) {
  if (!session?.imported) return null;

  switch (sncfPath) {
    case API_PATHS.SUBSCRIPTION_SUMMARY:
      return session.imported.subscription ?? null;
    case API_PATHS.SUBSCRIPTION_QRCODE:
      return session.imported.qr ?? null;
    case API_PATHS.CUSTOMER_READ:
      return session.imported.customer ?? null;
    case API_PATHS.CUSTOMER_INVOICES:
      return session.imported.invoices ?? { invoices: [] };
    case API_PATHS.REFDATA_STATIONS:
      return session.imported.stations ?? { stations: DEFAULT_STATIONS };
    case API_PATHS.RESERVATION_SEARCH: {
      const travels = [0, 1, 2].map((index) => buildTravel(body, index));
      const searchResults = { travels };
      updateImported(session, { searchResults });
      return searchResults;
    }
    case API_PATHS.RESERVATION_CONSULTATION:
      return session.imported.travels ?? { travels: [] };
    case API_PATHS.RESERVATION_PREFERENCES_READ:
      return session.imported.preferences ?? { preferences: [] };
    case API_PATHS.RESERVATION_GET_TRAVEL: {
      const travelId = String(body.travelId || "");
      const allTravels = [
        ...getTravels(session.imported.travels),
        ...getTravels(session.imported.searchResults),
      ];
      return (
        allTravels.find((travel) => travel.id === travelId) ?? {
          error: "TRAVEL_NOT_FOUND",
        }
      );
    }
    case API_PATHS.RESERVATION_BOOK: {
      return {
        error: "REQUIRES_LIVE_SESSION",
        message: "Connectez une session SNCF live pour reserver sur le site SNCF.",
      };
    }
    case API_PATHS.RESERVATION_CANCEL:
    case API_PATHS.RESERVATION_CONFIRM:
    case API_PATHS.RESERVATION_PRINT:
    case API_PATHS.RESERVATION_PREFERENCES_UPDATE:
    case API_PATHS.RESERVATION_EXCHANGE_SEARCH:
    case API_PATHS.RESERVATION_EXCHANGE_CONFIRM:
      return {
        error: "REQUIRES_LIVE_SESSION",
        message: "Cette action modifie votre compte SNCF et necessite une session live.",
      };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Live response normalization. The PWA was built against a simplified shape;
// the proxy maps the real SNCF payloads to it and keeps a per-session cache of
// the proposal/booking identifiers the PWA can't carry through itself (the
// search response's proposalId/segmentId/paoCookie are needed to book, and the
// PWA only round-trips a `travelId`).
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;

interface ProposalEntry {
  kind: "proposal";
  travel: Json;
  proposalId: string;
  segmentId: string;
  paoCookie: string;
  departureDateTime: string;
  // Kept so the proxy can re-fetch a fresh proposal if this one expired.
  originCode: string;
  destinationCode: string;
  trainNumber: string;
}
interface BookingEntry {
  kind: "booking";
  travel: Json;
  dvNumber?: string;
  orderId?: string;
  serviceItemId?: string;
}
type CacheEntry = ProposalEntry | BookingEntry;

const travelCache = new Map<string, Map<string, CacheEntry>>();
function sessionCache(sessionId: string): Map<string, CacheEntry> {
  let m = travelCache.get(sessionId);
  if (!m) {
    m = new Map();
    travelCache.set(sessionId, m);
  }
  return m;
}

function station(s: Json | undefined | null): Json {
  return { label: s?.label ?? "", code: s?.rrCode ?? s?.code ?? "" };
}
function carrierOf(equip: unknown): string {
  return equip === "INOUI" ? "TGV INOUI" : String(equip ?? "");
}
function durationOf(dep?: string, arr?: string): string {
  const ms = new Date(arr ?? "").getTime() - new Date(dep ?? "").getTime();
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const min = Math.round(ms / 60000);
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
}
function shortId(proposalId: string): string {
  // Use the full last path segment (uuid + "-N" suffix) so distinct proposals
  // sharing a base uuid don't collide into the same id.
  const seg = proposalId.split("/").filter(Boolean).pop() ?? crypto.randomUUID();
  return `p_${seg}`;
}
function toHHMM(t: unknown): string {
  const m = String(t ?? "").match(/(\d{1,2})\s*h?\s*(\d{2})?/);
  if (!m?.[1]) return "06:00";
  return `${m[1].padStart(2, "0")}:${(m[2] ?? "00").padStart(2, "0")}`;
}

function buildSearchRequest(body: Json, session: SessionLike): Json {
  const date =
    (body.departureDate as string) ||
    String(body.departureDateTime ?? "").slice(0, 10);
  const departureDateTime = String(body.departureDateTime ?? "").includes("T")
    ? (body.departureDateTime as string)
    : `${date}T${toHHMM(body.preferredTime)}`;
  return {
    origin: body.origin,
    destination: body.destination,
    departureDateTime,
    travelClass: body.travelClass ?? "2",
    productId: body.productId ?? "MFA_PT",
    cardNumber: body.cardNumber ?? session.cardNumber,
    hasWheelchairPlacement: false,
  };
}

function normalizeSearchResponse(sessionId: string, body: unknown): Json {
  const cache = sessionCache(sessionId);
  const journeys = Array.isArray((body as Json)?.journeys)
    ? ((body as Json).journeys as Json[])
    : [];
  const context = String((body as Json)?.context ?? "");
  const travels = journeys.map((j) => {
    const proposal = (j.proposal ?? {}) as Json;
    const proposalId = String(proposal.id ?? "");
    const id = shortId(proposalId);
    const travel: Json = {
      id,
      departureStation: station(j.origin as Json),
      arrivalStation: station(j.destination as Json),
      departureDateTime: j.departureDateTime,
      arrivalDateTime: j.arrivalDateTime,
      duration: durationOf(
        j.departureDateTime as string,
        j.arrivalDateTime as string,
      ),
      trainNumber: j.trainNumber,
      carrier: carrierOf(j.trainEquipment),
      status: proposal.isFullTrain || proposal.overbooking ? "WAITLIST" : "AVAILABLE",
      segments: [],
    };
    cache.set(id, {
      kind: "proposal",
      travel,
      proposalId,
      segmentId: String(j.segmentId ?? ""),
      paoCookie: context,
      departureDateTime: String(j.departureDateTime ?? ""),
      originCode: String((j.origin as Json)?.rrCode ?? (j.origin as Json)?.code ?? ""),
      destinationCode: String(
        (j.destination as Json)?.rrCode ?? (j.destination as Json)?.code ?? "",
      ),
      trainNumber: String(j.trainNumber ?? ""),
    });
    return travel;
  });
  return { travels };
}

function normalizeConsultationResponse(sessionId: string, body: unknown): Json {
  const cache = sessionCache(sessionId);
  const list = Array.isArray(body)
    ? (body as Json[])
    : Array.isArray((body as Json)?.travels)
      ? ((body as Json).travels as Json[])
      : [];
  const travels = list.map((t) => {
    const id = String(t.serviceItemId ?? t.dvNumber ?? crypto.randomUUID());
    const travel: Json = {
      id,
      departureStation: station(t.origin as Json),
      arrivalStation: station(t.destination as Json),
      departureDateTime: t.departureDateTime,
      arrivalDateTime: t.arrivalDateTime,
      duration: durationOf(
        t.departureDateTime as string,
        t.arrivalDateTime as string,
      ),
      trainNumber: t.trainNumber,
      carrier: carrierOf(t.trainEquipment),
      status: t.travelStatus === "VALIDE" ? "CONFIRMED" : String(t.travelStatus ?? ""),
      reservationId: t.dvNumber,
      seatNumber: t.seatNumber,
      coachNumber: t.coachNumber,
      orderId: t.orderId,
      serviceItemId: t.serviceItemId,
      segments: [],
    };
    cache.set(id, {
      kind: "booking",
      travel,
      dvNumber: t.dvNumber as string,
      orderId: t.orderId as string,
      serviceItemId: t.serviceItemId as string,
    });
    return travel;
  });
  return { travels };
}

const WEEKDAYS_FR = [
  "",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];
function hhmm(time: Json | undefined): string {
  const h = Number(time?.hours ?? 0);
  const m = Number(time?.minutes ?? 0);
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
}
function leg(pref: Json | undefined) {
  const origin = (pref?.origin ?? {}) as Json;
  const destination = (pref?.destination ?? {}) as Json;
  return {
    originLabel: origin.label ?? "",
    originCode: origin.code ?? origin.rrCode ?? "",
    destinationLabel: destination.label ?? "",
    destinationCode: destination.code ?? destination.rrCode ?? "",
    time: hhmm(pref?.time as Json),
  };
}
// Real read-preferences → the {preferences:[...]} list the PWA's "Favoris" use.
function normalizePreferences(body: unknown): Json {
  const active = ((body as Json)?.activeWeekDays ?? {}) as Record<string, unknown>;
  const criteria = ((body as Json)?.criteriaForWeekDay ?? {}) as Record<string, Json>;
  const preferences = Object.keys(criteria)
    .filter((k) => active[k])
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => {
      const c = criteria[k] as Json;
      return {
        day: WEEKDAYS_FR[Number(k)] ?? `Jour ${k}`,
        dayIndex: Number(k),
        outbound: leg(c?.departurePreferences as Json),
        return: leg(c?.returnPreferences as Json),
      };
    });
  return { preferences };
}

type SessionLike = NonNullable<ReturnType<typeof sessionStore.get>>;

// Resolve a single travel (search proposal or booked trip) from the cache,
// falling back to a fresh consultation if the cache was cleared (e.g. reload).
async function resolveTravel(
  session: SessionLike,
  correlationId: string,
  travelId: string,
): Promise<Json | null> {
  let entry = sessionCache(session.id).get(travelId);
  if (!entry) {
    const res = await sncfFetch(API_PATHS.RESERVATION_CONSULTATION, {
      method: "POST",
      body: { cardNumber: session.cardNumber },
      session,
      correlationId,
    });
    if (res.status >= 200 && res.status < 300) {
      normalizeConsultationResponse(session.id, res.body);
    }
    entry = sessionCache(session.id).get(travelId);
  }
  return entry?.travel ?? null;
}

// Resolve a booked-trip cache entry by id, refreshing from consultation if needed.
async function getBookingEntry(
  session: SessionLike,
  correlationId: string,
  id: string,
): Promise<BookingEntry | null> {
  let e = sessionCache(session.id).get(id);
  if (!e || e.kind !== "booking") {
    const res = await sncfFetch(API_PATHS.RESERVATION_CONSULTATION, {
      method: "POST",
      body: { cardNumber: session.cardNumber },
      session,
      correlationId,
    });
    if (res.status >= 200 && res.status < 300) {
      normalizeConsultationResponse(session.id, res.body);
    }
    e = sessionCache(session.id).get(id);
  }
  return e && e.kind === "booking" ? e : null;
}

function bookSucceeded(res: { status: number; body: unknown }): boolean {
  const empty =
    res.body == null ||
    (res.body instanceof ArrayBuffer && res.body.byteLength === 0) ||
    (typeof res.body === "object" && Object.keys(res.body as object).length === 0);
  // SNCF confirms with 204 No Content. A 200 carries a body (expired/rejected).
  return res.status === 204 || (res.status === 200 && empty);
}

async function bookProposal(
  entry: ProposalEntry,
  session: SessionLike,
  correlationId: string,
) {
  const payload: Json = {
    cardNumber: session.cardNumber,
    id: crypto.randomUUID(),
    proposals: [
      {
        proposalId: entry.proposalId,
        segmentId: entry.segmentId,
        departureDateTime: entry.departureDateTime,
        paoCookie: entry.paoCookie,
        assignmentOption: { forwardFacing: true, hasWheelchairPlacement: false },
        id: entry.proposalId,
      },
    ],
  };
  const res = await sncfFetch(API_PATHS.RESERVATION_BOOK, {
    method: "POST",
    body: payload,
    session,
    correlationId,
  });
  updateSessionCookies(session.id, session.sncfCookies, res.setCookies);
  return res;
}

// Re-run the search to obtain a fresh (non-expired) proposal for the same train.
async function freshProposal(
  entry: ProposalEntry,
  session: SessionLike,
  correlationId: string,
): Promise<ProposalEntry | null> {
  if (!entry.originCode || !entry.destinationCode) return null;
  const res = await sncfFetch(API_PATHS.RESERVATION_SEARCH, {
    method: "POST",
    body: {
      origin: entry.originCode,
      destination: entry.destinationCode,
      departureDateTime: entry.departureDateTime,
      travelClass: "2",
      productId: "MFA_PT",
      cardNumber: session.cardNumber,
      hasWheelchairPlacement: false,
    },
    session,
    correlationId,
  });
  if (res.status < 200 || res.status >= 300) return null;
  const body = res.body as Json;
  const journeys = Array.isArray(body?.journeys) ? (body.journeys as Json[]) : [];
  const j =
    journeys.find((x) => String(x.trainNumber) === entry.trainNumber) ?? journeys[0];
  if (!j) return null;
  const proposal = (j.proposal ?? {}) as Json;
  return {
    ...entry,
    proposalId: String(proposal.id ?? ""),
    segmentId: String(j.segmentId ?? ""),
    paoCookie: String(body?.context ?? ""),
    departureDateTime: String(j.departureDateTime ?? ""),
  };
}

export async function proxyPost(c: Context, sncfPath: string) {
  const session = c.get("session");
  const correlationId = c.get("correlationId");
  const body = (await c.req.json().catch(() => ({}))) as Json;

  const imported = importedResponse(session, sncfPath, body);
  if (imported) {
    const status = "error" in imported ? 409 : 200;
    return c.json(imported, status);
  }

  const live = !session.imported;

  // get-travel: served from the per-session cache (no upstream call needed).
  if (live && sncfPath === API_PATHS.RESERVATION_GET_TRAVEL) {
    const travel = await resolveTravel(
      session,
      correlationId,
      String(body.travelId ?? ""),
    );
    return c.json(travel ?? { error: "TRAVEL_NOT_FOUND" }, travel ? 200 : 404);
  }

  // book-travels: rebuild the real proposals payload from the cached search,
  // refreshing the proposal once if it expired between search and booking.
  if (live && sncfPath === API_PATHS.RESERVATION_BOOK) {
    const cacheKey = String(body.travelId ?? "");
    const entry = sessionCache(session.id).get(cacheKey);
    if (!entry || entry.kind !== "proposal") {
      return c.json(
        {
          error: "PROPOSAL_EXPIRED",
          message: "Relancez la recherche avant de reserver ce trajet.",
        },
        409,
      );
    }
    let res = await bookProposal(entry, session, correlationId);
    if (!bookSucceeded(res) && !res.isCaptcha) {
      const fresh = await freshProposal(entry, session, correlationId);
      if (fresh) {
        sessionCache(session.id).set(cacheKey, fresh);
        res = await bookProposal(fresh, session, correlationId);
      }
    }
    if (res.isCaptcha) {
      return c.json({ error: "CAPTCHA_REQUIRED", captchaUrl: res.captchaUrl }, 200);
    }
    if (!bookSucceeded(res)) {
      return c.json(
        {
          error: "BOOK_FAILED",
          message: "Trajet indisponible ou déjà réservé. Relancez la recherche.",
          upstream: res.body,
        },
        409,
      );
    }
    return c.json({ success: true });
  }

  // cancel-reservation: rebuild travelsInfo from the cached booked trip.
  if (live && sncfPath === API_PATHS.RESERVATION_CANCEL) {
    const id = String(body.reservationId ?? body.travelId ?? "");
    const entry = await getBookingEntry(session, correlationId, id);
    if (!entry) {
      return c.json({ error: "NOT_FOUND", message: "Réservation introuvable." }, 404);
    }
    const customerName = await ensureCustomerName(session, correlationId);
    const t = entry.travel;
    const payload: Json = {
      travelsInfo: [
        {
          marketingCarrierRef: entry.dvNumber,
          orderId: entry.orderId,
          customerName,
          trainNumber: t.trainNumber,
          departureDateTime: t.departureDateTime,
        },
      ],
    };
    const res = await sncfFetch(API_PATHS.RESERVATION_CANCEL, {
      method: "POST",
      body: payload,
      session,
      correlationId,
    });
    updateSessionCookies(session.id, session.sncfCookies, res.setCookies);
    if (res.isCaptcha) {
      return c.json({ error: "CAPTCHA_REQUIRED", captchaUrl: res.captchaUrl }, 200);
    }
    // Unlike book-travels, cancel confirms with a 2xx + body (not just 204).
    if (res.status < 200 || res.status >= 300) {
      return c.json({ error: "CANCEL_FAILED", upstream: res.body }, 409);
    }
    sessionCache(session.id).delete(id);
    return c.json({ success: true });
  }

  // print-travel: produce the trip's QR/barcode. Needs a tcn from get-travel.
  if (live && sncfPath === API_PATHS.RESERVATION_PRINT) {
    const id = String(body.travelId ?? body.reservationId ?? "");
    const entry = await getBookingEntry(session, correlationId, id);
    if (!entry) {
      return c.json({ error: "NOT_FOUND", message: "Réservation introuvable." }, 404);
    }
    const customerName = await ensureCustomerName(session, correlationId);
    const t = entry.travel;
    const gt = await sncfFetch(API_PATHS.RESERVATION_GET_TRAVEL, {
      method: "POST",
      body: {
        customerName,
        departureDateTime: t.departureDateTime,
        marketingCarrierRef: entry.dvNumber,
        trainNumber: t.trainNumber,
      },
      session,
      correlationId,
    });
    const tcn = (gt.body as { tcn?: string })?.tcn;
    const pr = await sncfFetch(API_PATHS.RESERVATION_PRINT, {
      method: "POST",
      body: {
        orderId: entry.orderId,
        serviceItemId: entry.serviceItemId,
        tcn: tcn ? [tcn] : [],
      },
      session,
      correlationId,
    });
    updateSessionCookies(session.id, session.sncfCookies, pr.setCookies);
    if (pr.isCaptcha) {
      return c.json({ error: "CAPTCHA_REQUIRED", captchaUrl: pr.captchaUrl }, 200);
    }
    return c.json(
      pr.body as Json,
      pr.status as ContentfulStatusCode,
    );
  }

  // Live session: inject the card number for endpoints that require it.
  if (live && CARD_NUMBER_PATHS.has(sncfPath) && !("cardNumber" in body)) {
    const cardNumber = await ensureCardNumber(session, correlationId);
    if (cardNumber) body.cardNumber = cardNumber;
  }

  const outboundBody =
    live && sncfPath === API_PATHS.RESERVATION_SEARCH
      ? buildSearchRequest(body, session)
      : sncfRequestBody(sncfPath, body);

  const result = await sncfFetch(sncfPath, {
    method: "POST",
    body: outboundBody,
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

  // Normalize the read endpoints the PWA consumes.
  if (live && result.status >= 200 && result.status < 300) {
    if (sncfPath === API_PATHS.RESERVATION_SEARCH) {
      return c.json(normalizeSearchResponse(session.id, result.body));
    }
    if (sncfPath === API_PATHS.RESERVATION_CONSULTATION) {
      return c.json(normalizeConsultationResponse(session.id, result.body));
    }
    if (sncfPath === API_PATHS.RESERVATION_PREFERENCES_READ) {
      return c.json(normalizePreferences(result.body));
    }
  }

  // Mutating endpoints (exchange / cancel) succeed with 204 No Content.
  // A 204 must carry no body — c.json() would emit "{}" and corrupt the response.
  const isEmpty =
    result.status === 204 ||
    result.body == null ||
    (result.body instanceof ArrayBuffer && result.body.byteLength === 0);
  if (isEmpty) {
    return c.body(null, result.status as ContentfulStatusCode);
  }

  return c.json(
    result.body as Record<string, unknown>,
    result.status as ContentfulStatusCode,
  );
}

export async function proxyGet(c: Context, sncfPath: string) {
  const session = c.get("session");
  const correlationId = c.get("correlationId");

  const imported = importedResponse(session, sncfPath);
  if (imported) return c.json(imported);

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
