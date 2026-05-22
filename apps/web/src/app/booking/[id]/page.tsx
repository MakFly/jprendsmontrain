"use client";

import { use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useMutation } from "@tanstack/react-query";
import { reservationApi } from "@/lib/api/reservation";
import { useRouter } from "next/navigation";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [booked, setBooked] = useState(false);

  const bookMutation = useMutation({
    mutationFn: () => reservationApi.bookTravel({ travelId: id }),
    onSuccess: () => setBooked(true),
  });

  if (booked) {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Reservation confirmee !</h2>
          <p className="text-sm text-muted-foreground">
            Votre voyage a ete reserve avec succes.
          </p>
          <button
            onClick={() => router.push("/trips")}
            className="min-h-[44px] rounded-xl bg-sncf-navy px-6 py-3 font-semibold text-white"
          >
            Voir mes voyages
          </button>
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
          <h2 className="font-semibold">Confirmer la reservation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Voyage #{id}
          </p>
        </div>

        <button
          onClick={() => bookMutation.mutate()}
          disabled={bookMutation.isPending}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-sncf-navy px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {bookMutation.isPending ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            "Confirmer la reservation"
          )}
        </button>

        {bookMutation.isError && (
          <p className="text-center text-sm text-destructive">
            Erreur lors de la reservation. Reessayez.
          </p>
        )}
      </div>
    </AppShell>
  );
}
