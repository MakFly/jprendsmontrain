"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/lib/api/auth";

interface AuthState {
  status: "unknown" | "authenticated" | "unauthenticated";
  setAuthenticated: () => void;
  setUnauthenticated: () => void;
  checkStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: "unknown",
      setAuthenticated: () => set({ status: "authenticated" }),
      setUnauthenticated: () => set({ status: "unauthenticated" }),
      checkStatus: async () => {
        try {
          const { authenticated } = await authApi.status();
          set({ status: authenticated ? "authenticated" : "unauthenticated" });
        } catch {
          set({ status: "unauthenticated" });
        }
      },
    }),
    { name: "max-auth-store" },
  ),
);
