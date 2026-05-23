"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/lib/api/auth";

// Transient banner state for a session that can no longer reach SNCF. Kept out
// of `status` on purpose: a single 401 (cookies rotated) must NOT flip the app
// to "unauthenticated" — that would bounce the user to /auth/login via the
// AuthGuard. Instead we surface a banner inviting a re-login.
export type SessionAlert =
  | null
  | { kind: "expired" }
  | { kind: "captcha"; url: string };

interface AuthState {
  status: "unknown" | "authenticated" | "unauthenticated";
  mode: "unknown" | "live" | "imported";
  expiresAt?: number;
  sessionAlert: SessionAlert;
  setAuthenticated: () => void;
  setUnauthenticated: () => void;
  notifySessionExpired: () => void;
  notifyCaptcha: (url: string) => void;
  clearSessionAlert: () => void;
  checkStatus: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const isOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: "unknown",
      mode: "unknown",
      sessionAlert: null,
      setAuthenticated: () => set({ status: "authenticated" }),
      setUnauthenticated: () =>
        set({ status: "unauthenticated", mode: "unknown", expiresAt: undefined, sessionAlert: null }),
      notifySessionExpired: () => set({ sessionAlert: { kind: "expired" } }),
      notifyCaptcha: (url) => set({ sessionAlert: { kind: "captcha", url } }),
      clearSessionAlert: () => set({ sessionAlert: null }),
      checkStatus: async () => {
        try {
          const { authenticated, mode, expiresAt } = await authApi.status();
          set({
            status: authenticated ? "authenticated" : "unauthenticated",
            mode: authenticated ? mode ?? "live" : "unknown",
            expiresAt,
          });
        } catch {
          // Offline: keep showing cached data instead of forcing a logout.
          if (isOffline()) {
            const s = get();
            set({
              status: s.status === "unauthenticated" ? "unauthenticated" : "authenticated",
              mode: s.mode === "unknown" ? "live" : s.mode,
            });
            return;
          }
          set({ status: "unauthenticated", mode: "unknown", expiresAt: undefined });
        }
      },
      refreshSession: async () => {
        // Don't attempt (or surface failures) while offline — keep the session.
        if (isOffline()) return;
        await authApi.refresh();
        const { authenticated, mode, expiresAt } = await authApi.status();
        set({
          status: authenticated ? "authenticated" : "unauthenticated",
          mode: authenticated ? mode ?? "live" : "unknown",
          expiresAt,
        });
      },
    }),
    {
      name: "max-auth-store",
      // Persist only the resolved status/mode so an offline cold-start can show
      // the app (and cached data) instead of bouncing to /auth/login. It self-
      // heals online: checkStatus re-derives from the proxy session cookie.
      partialize: (s) => ({ status: s.status, mode: s.mode }),
    },
  ),
);
