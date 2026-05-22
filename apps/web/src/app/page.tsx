"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "@/lib/api/subscription";
import { reservationApi } from "@/lib/api/reservation";
import { CreditCard, ArrowRight, Train } from "lucide-react";
import Link from "next/link";

function SubscriptionCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionApi.summary,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl bg-muted p-4">
        <div className="h-6 w-32 rounded bg-border" />
        <div className="mt-2 h-4 w-48 rounded bg-border" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-sncf-navy p-4 text-white">
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6" />
        <div>
          <h2 className="font-bold">
            {(data as Record<string, unknown>)?.productName as string ?? "MAX Actif"}
          </h2>
          <p className="text-sm opacity-80">
            {(data as Record<string, unknown>)?.customerName as string ?? "Abonne"}
          </p>
        </div>
      </div>
      <Link
        href="/subscription"
        className="mt-3 flex min-h-[44px] items-center justify-center rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/30"
      >
        Voir mon abonnement
      </Link>
    </div>
  );
}

function QuickSearch() {
  return (
    <Link
      href="/search"
      className="flex min-h-[44px] items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <Train className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Rechercher un trajet...
        </span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
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
          <div key={i} className="animate-pulse rounded-xl bg-muted p-4">
            <div className="h-5 w-40 rounded bg-border" />
            <div className="mt-2 h-4 w-24 rounded bg-border" />
          </div>
        ))}
      </div>
    );
  }

  const travels = (data?.travels ?? []) as Array<Record<string, unknown>>;
  const upcoming = travels
    .filter((t) => new Date(t.departureDateTime as string) > new Date())
    .slice(0, 3);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <Train className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Aucun voyage a venir
        </p>
        <Link
          href="/search"
          className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-sncf-navy px-4 py-2 text-sm font-medium text-white"
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
          className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {(trip.departureStation as Record<string, unknown>)?.label as string} →{" "}
                {(trip.arrivalStation as Record<string, unknown>)?.label as string}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(trip.departureDateTime as string).toLocaleDateString("fr-FR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      ))}
      <Link
        href="/trips"
        className="block text-center text-sm font-medium text-primary"
      >
        Voir tous les voyages
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6">
        <SubscriptionCard />
        <QuickSearch />
        <div>
          <h2 className="mb-3 font-semibold">Prochains voyages</h2>
          <UpcomingTrips />
        </div>
      </div>
    </AppShell>
  );
}
