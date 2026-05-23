"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "@/lib/api/subscription";
import { QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

function val(v: unknown) {
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

export default function SubscriptionPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionApi.summary,
  });

  const sub = data as Record<string, unknown> | undefined;
  const qrPayload = sub
    ? JSON.stringify({
        subscriptionNumber: sub.subscriptionNumber,
        customerName: sub.customerName,
        productName: sub.productName,
        route: sub.route,
      })
    : "";

  useEffect(() => {
    if (!qrPayload) return;
    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
    }).then(setQrDataUrl);
  }, [qrPayload]);

  const details = sub
    ? ([
        ["N° d'abonnement", sub.subscriptionNumber],
        ["Trajet", sub.route],
        ["Confort", sub.comfort],
        ["Paiement", sub.payment],
        ["Réservations restantes", sub.remainingReservations],
      ] as const)
    : [];
  const visibleDetails = details.filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );

  return (
    <AppShell>
      <div className="space-y-5">
        {isLoading && <div className="skeleton-sweep h-56 rounded-2xl bg-muted" />}

        {sub && (
          <>
            {/* Membership card */}
            <section className="surface-rail grain relative overflow-hidden rounded-2xl px-5 py-6 text-white">
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/60">
                      Abonnement
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold leading-none">
                      {val(sub.productName) || "MAX Actif"}
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/30">
                    {val(sub.status) || "Actif"}
                  </span>
                </div>

                <p className="mt-4 font-display text-lg font-semibold">
                  {val(sub.customerName)}
                </p>
                {(val(sub.startDate) || val(sub.endDate)) && (
                  <p className="mt-0.5 text-sm text-white/70">
                    {val(sub.startDate)}
                    {val(sub.endDate) ? ` → ${val(sub.endDate)}` : ""}
                  </p>
                )}

                {val(sub.subscriptionNumber) && (
                  <p className="tnum mt-4 font-mono text-sm tracking-wider text-white/80">
                    {val(sub.subscriptionNumber)}
                  </p>
                )}
              </div>
            </section>

            {/* QR card */}
            <section className="ticket-notch overflow-hidden rounded-2xl border border-dashed border-border bg-card p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <QrCode className="h-4 w-4" />
                <span className="text-[0.7rem] font-semibold uppercase tracking-wide">
                  Carte de transport
                </span>
              </div>
              <div className="mt-4 flex justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code abonnement MAX Actif"
                    className="h-60 w-60 rounded-xl bg-white p-3"
                  />
                ) : (
                  <div className="skeleton-sweep h-60 w-60 rounded-xl bg-muted" />
                )}
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Présentez ce QR au contrôle · enregistré localement
              </p>
            </section>

            {/* Details */}
            {visibleDetails.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-border bg-card">
                <h3 className="border-b border-border px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Détails
                </h3>
                <dl className="divide-y divide-border">
                  {visibleDetails.map(([label, value]) => (
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
          </>
        )}
      </div>
    </AppShell>
  );
}
