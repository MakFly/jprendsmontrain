"use client";

import { use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reservationApi } from "@/lib/api/reservation";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, ArrowLeftRight, X } from "lucide-react";
import Link from "next/link";

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => reservationApi.getTravel(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => reservationApi.cancelReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      router.push("/trips");
    },
  });

  const trip = data as Record<string, unknown> | undefined;

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6">
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        {isLoading && (
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 rounded bg-muted" />
            <div className="h-40 rounded-xl bg-muted" />
          </div>
        )}

        {trip && (
          <>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-3 w-3 items-center justify-center rounded-full bg-sncf-navy" />
                  <div>
                    <p className="font-semibold">
                      {(trip.departureStation as Record<string, unknown>)?.label as string}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trip.departureDateTime as string).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div className="ml-1.5 border-l-2 border-dashed border-border py-2 pl-5">
                  <p className="text-xs text-muted-foreground">
                    Train {trip.trainNumber as string} · {trip.duration as string}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-3 w-3 items-center justify-center rounded-full bg-sncf-red" />
                  <div>
                    <p className="font-semibold">
                      {(trip.arrivalStation as Record<string, unknown>)?.label as string}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trip.arrivalDateTime as string).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button className="flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card p-3 text-xs transition-colors hover:bg-muted">
                <Printer className="h-5 w-5" />
                Imprimer
              </button>
              <button
                onClick={() => router.push("/search")}
                className="flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card p-3 text-xs transition-colors hover:bg-muted"
              >
                <ArrowLeftRight className="h-5 w-5" />
                Echanger
              </button>
              <button
                onClick={() => {
                  if (confirm("Annuler cette reservation ?")) {
                    cancelMutation.mutate();
                  }
                }}
                disabled={cancelMutation.isPending}
                className="flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border border-destructive bg-card p-3 text-xs text-destructive transition-colors hover:bg-destructive/10"
              >
                <X className="h-5 w-5" />
                Annuler
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
