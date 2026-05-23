"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "@/lib/api/subscription";
import { reservationApi } from "@/lib/api/reservation";
import { useAuthStore } from "@/stores/auth-store";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  CreditCard,
  Search,
  ShieldCheck,
  Train,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function stationName(station: unknown) {
  return text((station as Record<string, unknown> | undefined)?.label, "Gare");
}

function formatTripDate(value: unknown) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "Date à confirmer";
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSessionExpiry(expiresAt?: number) {
  if (!expiresAt) return "";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "expirée";
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.max(1, Math.round((diff % (60 * 60 * 1000)) / 60000));
  if (hours > 0) return `${hours}h${String(minutes).padStart(2, "0")}`;
  return `${minutes} min`;
}

function SessionPanel() {
  const { mode, expiresAt } = useAuthStore();
  const expiry = formatSessionExpiry(expiresAt);

  if (mode === "live") {
    return (
      <section className="flex items-center gap-2.5 rounded-xl border border-emerald-600/25 bg-emerald-600/10 px-3.5 py-2.5 text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <p className="text-xs">
          Session SNCF active{expiry ? ` · encore ${expiry}` : ""}
        </p>
      </section>
    );
  }

  if (mode === "imported") {
    return (
      <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
        <div className="flex items-start gap-2.5">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Aperçu importé — les modifications SNCF demandent une session live.
            </p>
            <Button asChild size="sm" className="mt-2 rounded-lg">
              <Link href="/auth/login">Connecter SNCF live</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return null;
}

function SubscriptionCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionApi.summary,
  });

  if (isLoading) {
    return <div className="skeleton-sweep h-36 rounded-2xl bg-muted" />;
  }

  const sub = (data ?? {}) as Record<string, unknown>;
  const productName = text(sub.productName, text(sub.plan, "MAX Actif"));
  const customerName = text(sub.customerName, text(sub.holderName, ""));
  const remaining = sub.remainingReservations;

  return (
    <Link
      href="/subscription"
      className="surface-rail grain relative block overflow-hidden rounded-2xl px-5 py-5 text-white transition-transform active:scale-[0.99]"
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-2 text-white/65">
            <CreditCard className="h-4 w-4" />
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em]">
              Abonnement
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-white/55" />
        </div>
        <h2 className="mt-3 font-display text-2xl font-bold leading-none">
          {productName}
        </h2>
        {customerName && (
          <p className="mt-1.5 text-sm text-white/70">{customerName}</p>
        )}
        {remaining !== undefined && remaining !== null && (
          <div className="mt-4 flex items-baseline gap-2">
            <span className="tnum font-mono text-3xl font-bold leading-none">
              {String(remaining)}
            </span>
            <span className="text-sm text-white/70">réservations restantes</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function ActionGrid() {
  return (
    <section className="grid grid-cols-2 gap-3">
      <Link
        href="/search"
        className="flex min-h-[100px] flex-col justify-between rounded-2xl bg-sncf-red p-4 text-white shadow-sm transition-transform active:scale-[0.98]"
      >
        <Search className="h-6 w-6" strokeWidth={2.2} />
        <span className="font-display text-base font-bold">Réserver</span>
      </Link>
      <Link
        href="/trips"
        className="flex min-h-[100px] flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-transform active:scale-[0.98]"
      >
        <CalendarDays className="h-6 w-6 text-sncf-navy dark:text-stone-300" />
        <span className="font-display text-base font-bold">Mes voyages</span>
      </Link>
    </section>
  );
}

function UpcomingTrips() {
  const { data, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: reservationApi.travelConsultation,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="skeleton-sweep h-[4.5rem] rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  const travels = (data?.travels ?? []) as Array<Record<string, unknown>>;
  const upcoming = travels
    .filter((t) => new Date(t.departureDateTime as string) > new Date())
    .sort(
      (a, b) =>
        new Date(a.departureDateTime as string).getTime() -
        new Date(b.departureDateTime as string).getTime(),
    )
    .slice(0, 3);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        <Train className="mx-auto h-7 w-7 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Aucun voyage à venir</p>
        <Link
          href="/search"
          className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-sncf-navy px-4 text-sm font-semibold text-white active:scale-[0.98]"
        >
          Rechercher un trajet
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcoming.map((trip, i) => (
        <Link
          key={i}
          href={`/trips/${trip.id as string}`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-transform active:scale-[0.99]"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {stationName(trip.departureStation)}
              <span className="mx-1.5 text-muted-foreground">→</span>
              {stationName(trip.arrivalStation)}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatTripDate(trip.departureDateTime)}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <SubscriptionCard />
        <ActionGrid />
        <section className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide">
              Prochains voyages
            </h2>
            <Link
              href="/trips"
              className="text-xs font-semibold text-primary dark:text-stone-300"
            >
              Tout voir
            </Link>
          </div>
          <UpcomingTrips />
        </section>
      </div>
    </AppShell>
  );
}
