"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useQuery } from "@tanstack/react-query";
import { reservationApi } from "@/lib/api/reservation";
import { Train, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function TripsPage() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { data, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: reservationApi.travelConsultation,
  });

  const travels = (data?.travels ?? []) as Array<Record<string, unknown>>;
  const now = new Date();
  const upcoming = travels.filter(
    (t) => new Date(t.departureDateTime as string) > now,
  );
  const past = travels.filter(
    (t) => new Date(t.departureDateTime as string) <= now,
  );
  const displayed = tab === "upcoming" ? upcoming : past;

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex rounded-lg border border-border bg-muted p-1">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t === "upcoming"
                ? `A venir (${upcoming.length})`
                : `Passes (${past.length})`}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl bg-muted p-4">
                <div className="h-5 w-40 rounded bg-border" />
                <div className="mt-2 h-4 w-24 rounded bg-border" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && displayed.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Train className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {tab === "upcoming"
                ? "Aucun voyage a venir"
                : "Aucun voyage passe"}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {displayed.map((trip, i) => (
            <Link
              key={i}
              href={`/trips/${trip.id as string}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
            >
              <div>
                <p className="font-semibold">
                  {(trip.departureStation as Record<string, unknown>)?.label as string}{" "}
                  → {(trip.arrivalStation as Record<string, unknown>)?.label as string}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(trip.departureDateTime as string).toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · Train {trip.trainNumber as string}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
