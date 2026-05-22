import { SESSION_TTL_MS } from "@max-sncf/shared";

export interface SessionData {
  id: string;
  sncfCookies: string[];
  xsrfToken: string;
  createdAt: number;
  expiresAt: number;
}

class SessionStore {
  private sessions = new Map<string, SessionData>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  create(sncfCookies: string[], xsrfToken: string): SessionData {
    const id = crypto.randomUUID();
    const now = Date.now();
    const session: SessionData = {
      id,
      sncfCookies,
      xsrfToken,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };
    this.sessions.set(id, session);
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

  update(id: string, data: Partial<Pick<SessionData, "sncfCookies" | "xsrfToken">>): void {
    const session = this.sessions.get(id);
    if (!session) return;
    if (data.sncfCookies) session.sncfCookies = data.sncfCookies;
    if (data.xsrfToken) session.xsrfToken = data.xsrfToken;
  }

  destroy(id: string): void {
    this.sessions.delete(id);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now > session.expiresAt) {
        this.sessions.delete(id);
      }
    }
  }

  dispose(): void {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}

export const sessionStore = new SessionStore();
