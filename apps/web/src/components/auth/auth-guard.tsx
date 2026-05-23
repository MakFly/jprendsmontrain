"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status, checkStatus, refreshSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    // Periodic background refresh only. We deliberately do NOT refresh on every
    // window `focus`: mobile Chrome fires focus constantly (taps, keyboard,
    // address-bar hide), which made the app refresh — and log out — on every
    // interaction. A refresh failure must NOT bounce to login either: the
    // session can still be valid; individual data calls determine that.
    const interval = window.setInterval(() => {
      refreshSession().catch(() => {
        /* keep the session; do not force a logout on a transient refresh error */
      });
    }, 10 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [status, refreshSession, router]);

  if (status === "unknown") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return <>{children}</>;
}
