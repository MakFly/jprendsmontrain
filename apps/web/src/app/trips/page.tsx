"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useQuery } from "@tanstack/react-query";
import { reservationApi } from "@/lib/api/reservation";
import { Train, ArrowRight, ShieldAlert, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Trip = Record<string, unknown>;

function hm(value: unknown) {
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function dayLabel(value: unknown) {
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
function station(t: Trip, key: "departureStation" | "arrivalStation") {
  return (t[key] as Record<string, unknown> | undefined)?.label as string;
}

export default function TripsPage() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["trips"],
    queryFn: reservationApi.travelConsultation,
  });

  const travels = (data?.travels ?? []) as Trip[];
  const now = new Date();
  const upcoming = travels
    .filter((t) => new Date(t.departureDateTime as string) > now)
    .sort(
      (a, b) =>
        new Date(a.departureDateTime as string).getTime() -
        new Date(b.departureDateTime as string).getTime(),
    );
  const past = travels
    .filter((t) => new Date(t.departureDateTime as string) <= now)
    .sort(
      (a, b) =>
        new Date(b.departureDateTime as string).getTime() -
        new Date(a.departureDateTime as string).getTime(),
    );
  const displayed = tab === "upcoming" ? upcoming : past;

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Manual refresh (pull-to-refresh also works via AppShell) */}
        <div className="flex justify-end px-0.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Actualiser"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors active:scale-[0.97] disabled:opacity-60"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Actualiser
          </button>
        </div>

        {/* Segmented control */}
        <div className="flex rounded-xl border border-border bg-muted p-1">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                tab === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {t === "upcoming" ? `À venir (${upcoming.length})` : `Passés (${past.length})`}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-sweep h-[5.5rem] rounded-2xl bg-muted" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-2 text-sm font-medium">
              Impossible de charger vos voyages
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Votre session SNCF a expiré. Vos réservations ne sont pas perdues —{" "}
              <Link
                href="/auth/login"
                className="font-medium text-primary underline underline-offset-2"
              >
                reconnectez-vous
              </Link>{" "}
              pour les réafficher.
            </p>
          </div>
        )}

        {!isLoading && !isError && displayed.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Train className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {tab === "upcoming" ? "Aucun voyage à venir" : "Aucun voyage passé"}
            </p>
            {tab === "upcoming" && (
              <Link
                href="/search"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-sncf-navy px-4 text-sm font-semibold text-white active:scale-[0.98]"
              >
                Rechercher un trajet
              </Link>
            )}
          </div>
        )}

        <div className="space-y-3">
          {displayed.map((trip, i) => {
            const confirmed =
              trip.status === "CONFIRMED" || trip.status === "VALIDE";
            return (
              <Link
                key={String(trip.id ?? i)}
                href={`/trips/${trip.id as string}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="board-flip flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform active:scale-[0.99]"
              >
                <div className="flex shrink-0 flex-col items-center">
                  <span className="tnum font-mono text-xl font-bold leading-none">
                    {hm(trip.departureDateTime)}
                  </span>
                  <span className="mt-1 text-[0.65rem] uppercase text-muted-foreground">
                    {hm(trip.arrivalDateTime)}
                  </span>
                </div>
                <div className="h-10 w-px shrink-0 bg-gradient-to-b from-sncf-navy/40 to-sncf-red/40" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-tight">
                    {station(trip, "departureStation")}
                    <span className="mx-1.5 text-muted-foreground">→</span>
                    {station(trip, "arrivalStation")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dayLabel(trip.departureDateTime)} ·{" "}
                    {String(trip.carrier ?? "TGV")} {String(trip.trainNumber ?? "")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      confirmed ? "bg-emerald-500" : "bg-muted-foreground/40",
                    )}
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
