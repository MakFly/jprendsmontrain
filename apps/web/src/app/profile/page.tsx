"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { LogOut, FileText, Settings, Receipt } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  async function handleLogout() {
    try {
      const result = await authApi.logout();
      setUnauthenticated();
      if (result.redirectLogoutSession) {
        window.location.href = result.redirectLogoutSession;
      } else {
        router.replace("/auth/login");
      }
    } catch {
      setUnauthenticated();
      router.replace("/auth/login");
    }
  }

  const menuItems = [
    { href: "/invoices", icon: Receipt, label: "Factures" },
    { href: "/preferences", icon: Settings, label: "Preferences de voyage" },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6">
        <div className="space-y-2">
          {menuItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-[44px] items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-destructive px-4 py-3 font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          Se deconnecter
        </button>
      </div>
    </AppShell>
  );
}
