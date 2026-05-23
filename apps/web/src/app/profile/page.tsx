"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { customerApi } from "@/lib/api/customer";
import { useRouter } from "next/navigation";
import { LogOut, Shield, User } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

export default function ProfilePage() {
  const router = useRouter();
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);
  const { data: customer } = useQuery({
    queryKey: ["customer"],
    queryFn: customerApi.read,
  });

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

  const firstName = (customer?.firstName as string) ?? "";
  const lastName = (customer?.lastName as string) ?? "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`
    .toUpperCase()
    .trim();

  const rows = customer
    ? ([
        ["Email", customer.email],
        ["Téléphone", customer.phone],
        ["Adresse", customer.address],
        ["Code postal", customer.postalCode],
        ["Ville", customer.city],
      ] as const)
    : [];
  const visibleRows = rows.filter(([, value]) => value);

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Identity */}
        <section className="surface-rail grain relative overflow-hidden rounded-2xl px-5 py-6 text-white">
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 font-display text-xl font-bold ring-1 ring-white/20">
              {initials || <User className="h-7 w-7" />}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold leading-tight">
                {firstName || lastName
                  ? `${firstName} ${lastName}`.trim()
                  : "Mon profil"}
              </h2>
              <p className="mt-0.5 text-sm text-white/70">Abonné MAX Actif</p>
            </div>
          </div>
        </section>

        {/* Contact details */}
        {visibleRows.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <h3 className="border-b border-border px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Coordonnées
            </h3>
            <dl className="divide-y divide-border">
              {visibleRows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="truncate text-right font-medium">
                    {String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <button
          onClick={handleLogout}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 font-semibold text-destructive transition-colors active:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          Se déconnecter
        </button>

        <Link
          href="/privacy"
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-border text-sm font-medium text-muted-foreground transition-colors active:bg-muted"
        >
          <Shield className="h-4 w-4" />
          Politique de confidentialite
        </Link>

        <p className="pt-1 text-center text-xs text-muted-foreground">
          MAX SNCF · TGV INOUI
        </p>
      </div>
    </AppShell>
  );
}
