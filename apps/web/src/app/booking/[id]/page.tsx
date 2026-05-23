"use client";

import { use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reservationApi } from "@/lib/api/reservation";
import { useRouter } from "next/navigation";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/lib/api-client";

export default function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionMode = useAuthStore((state) => state.mode);
  const [booked, setBooked] = useState(false);
  const { data: travel } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => reservationApi.getTravel(id),
  });
  const trip = travel as Record<string, unknown> | undefined;

  const bookMutation = useMutation({
    mutationFn: () => reservationApi.bookTravel({ travelId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setBooked(true);
    },
  });
  const mutationError =
    bookMutation.error instanceof ApiError &&
    typeof bookMutation.error.data === "object" &&
    bookMutation.error.data !== null &&
    "message" in bookMutation.error.data
      ? String((bookMutation.error.data as { message?: unknown }).message)
      : "Erreur lors de la reservation. Reessayez.";

  if (booked) {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Reservation enregistree !</h2>
          <p className="text-sm text-muted-foreground">
            Votre voyage est sauvegarde dans Mes voyages.
          </p>
          <Button
            onClick={() => router.push("/trips")}
            className="rounded-xl"
          >
            Voir mes voyages
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour a la recherche
        </Link>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Confirmer la reservation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {trip
                  ? `${(trip.departureStation as Record<string, unknown>)?.label as string} → ${
                      (trip.arrivalStation as Record<string, unknown>)?.label as string
                    }`
                  : `Voyage #${id}`}
              </p>
            </div>
            <Badge variant="outline">{(trip?.trainNumber as string) ?? "TGV"}</Badge>
          </div>
          {trip && (
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Depart</dt>
                <dd className="text-right font-medium">
                  {new Date(trip.departureDateTime as string).toLocaleString("fr-FR")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Arrivee</dt>
                <dd className="text-right font-medium">
                  {new Date(trip.arrivalDateTime as string).toLocaleString("fr-FR")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Statut</dt>
                <dd className="text-right font-medium">
                  {trip.status === "AVAILABLE" ? "Disponible" : "Liste d'attente"}
                </dd>
              </div>
            </dl>
          )}
        </div>

        {sessionMode === "imported" && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
            Cette recherche vient d'un apercu importe. Pour enregistrer ce voyage sur
            le site SNCF, connectez une session live avant de reserver.
            <Link href="/auth/login" className="mt-2 block font-semibold underline">
              Connecter une session live SNCF
            </Link>
          </div>
        )}

        <Button
          onClick={() => bookMutation.mutate()}
          disabled={
            bookMutation.isPending ||
            trip?.status === "WAITLIST" ||
            sessionMode !== "live"
          }
          className="w-full rounded-xl"
        >
          {bookMutation.isPending ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            "Enregistrer la reservation"
          )}
        </Button>

        {bookMutation.isError && (
          <p className="text-center text-sm text-destructive">
            {mutationError}
          </p>
        )}
      </div>
    </AppShell>
  );
}
