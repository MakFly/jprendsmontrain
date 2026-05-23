"use client";

import { use, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reservationApi } from "@/lib/api/reservation";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, QrCode, TriangleAlert, X } from "lucide-react";
import Link from "next/link";

type Json = Record<string, unknown>;
type Station = { label?: string; code?: string };

function hm(v: unknown) {
  const d = new Date(v as string);
  return Number.isNaN(d.getTime())
    ? "--:--"
    : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function longDate(v: unknown) {
  const d = new Date(v as string);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => reservationApi.getTravel(id),
  });
  const trip = data as Json | undefined;

  // QR is fetched and cached (so it stays available offline at the gate).
  const qr = useQuery({
    queryKey: ["qr", id],
    queryFn: () => reservationApi.printTravel(id),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
  const barcode = (qr.data as { barcodeImageData?: string } | undefined)
    ?.barcodeImageData;

  const cancel = useMutation({
    mutationFn: () => reservationApi.cancelReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      router.push("/trips");
    },
  });

  const dep = trip?.departureStation as Station | undefined;
  const arr = trip?.arrivalStation as Station | undefined;

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-5">
        <Link
          href="/trips"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Mes voyages
        </Link>

        {isLoading && (
          <div className="skeleton-sweep h-96 rounded-3xl border border-border bg-card" />
        )}

        {trip && (
          <>
            {/* Boarding pass */}
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              {/* header */}
              <div className="surface-rail grain relative px-5 py-4 text-white">
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/60">
                    {longDate(trip.departureDateTime)}
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 font-mono text-[0.7rem] font-bold">
                    {String(trip.reservationId ?? "")}
                  </span>
                </div>
                <div className="relative z-10 mt-3 flex items-end justify-between">
                  <div>
                    <p className="tnum font-mono text-3xl font-bold leading-none">
                      {hm(trip.departureDateTime)}
                    </p>
                    <p className="mt-1 text-sm text-white/70">{dep?.label}</p>
                  </div>
                  <div className="px-2 pb-1 text-center">
                    <p className="text-[0.65rem] uppercase tracking-wider text-white/50">
                      {String(trip.duration ?? "")}
                    </p>
                    <div className="my-1 flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-white/60" />
                      <span className="h-px w-10 bg-white/30" />
                      <span className="h-1 w-1 rounded-full bg-sncf-red" />
                    </div>
                    <p className="font-mono text-[0.65rem] text-white/60">
                      {String(trip.carrier ?? "TGV")} {String(trip.trainNumber ?? "")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tnum font-mono text-3xl font-bold leading-none">
                      {hm(trip.arrivalDateTime)}
                    </p>
                    <p className="mt-1 text-sm text-white/70">{arr?.label}</p>
                  </div>
                </div>
              </div>

              {/* perforation divider */}
              <div className="relative h-0">
                <div className="ticket-notch absolute inset-x-0 top-0 border-t border-dashed border-border" />
              </div>

              {/* QR */}
              <div className="flex flex-col items-center px-5 pb-5 pt-7">
                {qr.isPending && (
                  <div className="flex h-44 w-44 items-center justify-center rounded-xl bg-muted">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {barcode && (
                  <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={barcode}
                      alt="QR Code du billet"
                      className="h-44 w-44 [image-rendering:pixelated]"
                    />
                  </div>
                )}
                {qr.isError && !barcode && (
                  <div className="flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
                    <QrCode className="h-7 w-7 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => qr.refetch()}
                      className="text-xs font-semibold text-sncf-navy underline"
                    >
                      Recharger le QR
                    </button>
                  </div>
                )}
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Présentez ce QR au contrôle · disponible hors-ligne
                </p>

                {/* seat */}
                {Boolean(trip.coachNumber || trip.seatNumber) && (
                  <div className="mt-4 flex w-full justify-center gap-6 border-t border-border pt-4 text-center">
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        Voiture
                      </p>
                      <p className="tnum font-mono text-lg font-bold">
                        {String(trip.coachNumber ?? "—")}
                      </p>
                    </div>
                    <div className="w-px bg-border" />
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        Place
                      </p>
                      <p className="tnum font-mono text-lg font-bold">
                        {String(trip.seatNumber ?? "—")}
                      </p>
                    </div>
                    <div className="w-px bg-border" />
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        Classe
                      </p>
                      <p className="tnum font-mono text-lg font-bold">
                        {String(trip.travelClass ?? "2")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel */}
            {!confirming ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
                Annuler la réservation
              </button>
            ) : (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
                <div className="flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-sm text-foreground">
                    Annuler ce trajet ? Ta réservation sera recréditée sur ton
                    abonnement MAX Actif.
                  </p>
                </div>
                {cancel.isError && (
                  <p className="mt-2 text-xs text-destructive">
                    Annulation impossible pour le moment. Réessaye.
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={cancel.isPending}
                    className="flex-1 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold"
                  >
                    Garder
                  </button>
                  <button
                    type="button"
                    onClick={() => cancel.mutate()}
                    disabled={cancel.isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {cancel.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Confirmer l'annulation"
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
