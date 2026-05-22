"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1 px-4 py-4 pb-20">{children}</main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
