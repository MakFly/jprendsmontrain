"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { reservationApi } from "@/lib/api/reservation";

export default function PreferencesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["preferences"],
    queryFn: reservationApi.readPreferences,
  });
  const preferences = ((data as Record<string, unknown> | undefined)?.preferences ?? []) as Array<
    Record<string, unknown>
  >;

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-3">
        {isLoading && (
          <div className="animate-pulse rounded-xl bg-muted p-6">
            <div className="h-5 w-40 rounded bg-border" />
            <div className="mt-3 h-4 w-56 rounded bg-border" />
          </div>
        )}

        {!isLoading && preferences.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Settings className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Vos preferences de voyage apparaitront ici
            </p>
          </div>
        )}

        {preferences.map((preference) => (
          <div
            key={preference.day as string}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">{preference.day as string}</h2>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {Boolean(preference.outbound) && (
                <p>
                  <span className="font-medium">Aller</span>
                  {" · "}
                  {preference.outboundTime as string} · {preference.outbound as string}
                </p>
              )}
              {Boolean(preference.return) && (
                <p>
                  <span className="font-medium">Retour</span>
                  {" · "}
                  {preference.returnTime as string} · {preference.return as string}
                </p>
              )}
            </div>
          </div>
        ))}

        {!isLoading && preferences.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
            <Settings className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2">Préférences synchronisées depuis MAX ACTIF</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
