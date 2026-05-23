import { SESSION_TTL_MS } from "@max-sncf/shared";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// Where sessions are persisted so they survive proxy restarts / --watch reloads.
// In-memory only would log every device out on each restart (the cause of
// "session save doesn't work" on the phone).
const STORE_FILE =
  process.env.SESSION_STORE_FILE ||
  `${process.env.HOME || "."}/.cache/max-sncf/sessions.json`;

// Each (re-)login mints a new session; SNCF's captured cookies rotate within
// minutes, so users re-log often and stale sessions pile up. Keep only the most
// recent few — older ones are dead weight (their cookies 401). Override via env.
const MAX_SESSIONS = Number(process.env.MAX_SESSIONS) || 5;

export interface SessionData {
  id: string;
  sncfCookies: string[];
  xsrfToken: string;
  /**
   * User-Agent the `datadome` cookie was issued for. DataDome binds its cookie
   * to UA + IP, so server-side calls MUST replay this exact UA or they get a
   * 403 captcha. Empty for legacy/imported sessions.
   */
  userAgent?: string;
  /** Cached MAX card number, fetched lazily from read-customer for a live
   * session. Many SNCF endpoints require it in the request body, but the PWA
   * doesn't know it, so the proxy injects it. */
  cardNumber?: string;
  /** Customer last name — required by get-travel / cancel-reservation. */
  customerName?: string;
  imported?: ImportedSessionData;
  createdAt: number;
  expiresAt: number;
}

export interface ImportedSessionData {
  source: "browser";
  importedAt: string;
  subscription?: Record<string, unknown>;
  customer?: Record<string, unknown>;
  travels?: Record<string, unknown>;
  searchResults?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  invoices?: Record<string, unknown>;
  stations?: Record<string, unknown>;
  qr?: Record<string, unknown>;
}

class SessionStore {
  private sessions = new Map<string, SessionData>();
  private cleanupInterval: ReturnType<typeof setInterval>;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.load();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  // Restore non-expired sessions from disk on startup.
  private load(): void {
    try {
      const raw = readFileSync(STORE_FILE, "utf8");
      const arr = JSON.parse(raw) as SessionData[];
      const now = Date.now();
      for (const s of arr) {
        if (s?.id && s.expiresAt > now) this.sessions.set(s.id, s);
      }
      const removed = this.prune();
      console.log(
        `[session-store] loaded ${this.sessions.size} session(s) from ${STORE_FILE}` +
          (removed ? ` (pruned ${removed} stale over cap ${MAX_SESSIONS})` : ""),
      );
      if (removed) this.persist();
    } catch (e) {
      console.log(`[session-store] no sessions loaded from ${STORE_FILE}: ${(e as Error).message}`);
    }
  }

  // Keep only the MAX_SESSIONS most recently created sessions; drop the rest.
  // Returns how many were removed.
  private prune(): number {
    if (this.sessions.size <= MAX_SESSIONS) return 0;
    const newestFirst = [...this.sessions.values()].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    let removed = 0;
    for (const s of newestFirst.slice(MAX_SESSIONS)) {
      this.sessions.delete(s.id);
      removed += 1;
    }
    return removed;
  }

  // Debounced write of all live sessions to disk.
  private persist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      try {
        mkdirSync(dirname(STORE_FILE), { recursive: true });
        writeFileSync(STORE_FILE, JSON.stringify([...this.sessions.values()]));
      } catch {
        /* disk issue — non-fatal, sessions still live in memory */
      }
    }, 400);
  }

  create(
    sncfCookies: string[],
    xsrfToken: string,
    userAgent?: string,
  ): SessionData {
    return this.createSession({ sncfCookies, xsrfToken, userAgent });
  }

  createImported(imported: ImportedSessionData): SessionData {
    return this.createSession({ sncfCookies: [], xsrfToken: "", imported });
  }

  private createSession(
    data: Pick<SessionData, "sncfCookies" | "xsrfToken"> &
      Partial<Pick<SessionData, "imported" | "userAgent">>,
  ): SessionData {
    const id = crypto.randomUUID();
    const now = Date.now();
    const session: SessionData = {
      id,
      sncfCookies: data.sncfCookies,
      xsrfToken: data.xsrfToken,
      userAgent: data.userAgent,
      imported: data.imported,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };
    this.sessions.set(id, session);
    this.prune();
    this.persist();
    return session;
  }

  get(id: string): SessionData | null {
    const session = this.sessions.get(id);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(id);
      return null;
    }
    return session;
  }

  update(
    id: string,
    data: Partial<
      Pick<
        SessionData,
        | "sncfCookies"
        | "xsrfToken"
        | "imported"
        | "userAgent"
        | "cardNumber"
        | "customerName"
      >
    >,
  ): void {
    const session = this.sessions.get(id);
    if (!session) return;
    if (data.sncfCookies) session.sncfCookies = data.sncfCookies;
    if (data.xsrfToken) session.xsrfToken = data.xsrfToken;
    if (data.imported) session.imported = data.imported;
    if (data.userAgent) session.userAgent = data.userAgent;
    if (data.cardNumber) session.cardNumber = data.cardNumber;
    if (data.customerName) session.customerName = data.customerName;
    this.persist();
  }

  touch(id: string): void {
    const session = this.sessions.get(id);
    if (!session) return;
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    this.persist();
  }

  destroy(id: string): void {
    this.sessions.delete(id);
    this.persist();
  }

  private cleanup(): void {
    const now = Date.now();
    let changed = false;
    for (const [id, session] of this.sessions) {
      if (now > session.expiresAt) {
        this.sessions.delete(id);
        changed = true;
      }
    }
    if (changed) this.persist();
  }

  dispose(): void {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}

export const sessionStore = new SessionStore();
