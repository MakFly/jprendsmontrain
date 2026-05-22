"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "@/lib/api/subscription";
import { CreditCard, QrCode } from "lucide-react";
import { useState } from "react";

export default function SubscriptionPage() {
  const [showQr, setShowQr] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionApi.summary,
  });

  const sub = data as Record<string, unknown> | undefined;

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6">
        {isLoading && (
          <div className="animate-pulse space-y-4">
            <div className="h-40 rounded-xl bg-muted" />
          </div>
        )}

        {sub && (
          <div className="rounded-xl bg-sncf-navy p-6 text-white">
            <div className="flex items-start gap-4">
              <CreditCard className="h-8 w-8 shrink-0" />
              <div className="space-y-1">
                <h2 className="text-xl font-bold">
                  {sub.productName as string ?? "MAX Actif"}
                </h2>
                <p className="text-sm opacity-80">
                  {sub.customerName as string}
                </p>
                <p className="text-sm opacity-80">
                  Du {sub.startDate as string} au {sub.endDate as string}
                </p>
                <p className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                  {sub.status as string ?? "Actif"}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowQr(!showQr)}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-medium transition-colors hover:bg-muted"
        >
          <QrCode className="h-5 w-5" />
          {showQr ? "Masquer" : "Afficher"} le QR Code
        </button>

        {showQr && (
          <div className="flex justify-center rounded-xl border border-border bg-white p-6">
            <div className="text-center">
              <p className="mb-4 text-sm text-gray-600">
                Presentez ce QR code au controleur
              </p>
              <div className="mx-auto h-48 w-48 rounded-lg bg-gray-100 p-4">
                <p className="mt-16 text-xs text-gray-400">
                  QR code charge depuis l'API
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
