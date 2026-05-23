"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { SessionModeBanner } from "@/components/auth/session-mode-banner";
import { SessionAlert } from "@/components/auth/session-alert";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* The app is mobile-first by design: on any wider screen it stays a
          centered phone-width column (a "device frame") on a muted backdrop,
          rather than stretching. 14px base for app density. */}
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-background text-[14px] leading-relaxed sm:shadow-2xl sm:shadow-black/10">
        <Header />
        <SessionAlert />
        <SessionModeBanner />
        <main className="flex-1 px-4 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
