"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useMutation, useQuery } from "@tanstack/react-query";
import { reservationApi } from "@/lib/api/reservation";
import { refdataApi } from "@/lib/api/refdata";
import { ArrowUpDown, Search, Clock } from "lucide-react";
import Link from "next/link";

function StationInput({
  label,
  value,
  onChange,
  stations,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  stations: Array<{ code: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = stations.filter((s) =>
    s.label.toLowerCase().includes(search.toLowerCase()),
  );
  const selected = stations.find((s) => s.code === value);

  return (
    <div className="relative">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-[44px] w-full items-center rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
      >
        {selected?.label || (
          <span className="text-muted-foreground">Choisir une gare...</span>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-card shadow-lg">
          <div className="sticky top-0 border-b border-border bg-card p-2">
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
          {filtered.slice(0, 50).map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => {
                onChange(s.code);
                setOpen(false);
                setSearch("");
              }}
              className="flex min-h-[44px] w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0] ?? "",
  );

  const { data: stationsData } = useQuery({
    queryKey: ["stations"],
    queryFn: refdataApi.getStations,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const searchMutation = useMutation({
    mutationFn: reservationApi.searchTravels,
  });

  const stations = (stationsData?.stations ?? []) as Array<{
    code: string;
    label: string;
  }>;

  function swap() {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination || !date) return;
    searchMutation.mutate({ origin, destination, departureDate: date });
  }

  const results = (searchMutation.data?.travels ?? []) as Array<
    Record<string, unknown>
  >;

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative space-y-2">
            <StationInput
              label="Depart"
              value={origin}
              onChange={setOrigin}
              stations={stations}
            />

            <button
              type="button"
              onClick={swap}
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>

            <StationInput
              label="Arrivee"
              value={destination}
              onChange={setDestination}
              stations={stations}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="flex min-h-[44px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!origin || !destination || !date || searchMutation.isPending}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-sncf-navy px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {searchMutation.isPending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Search className="h-4 w-4" />
                Rechercher
              </>
            )}
          </button>
        </form>

        {searchMutation.isError && (
          <p className="text-center text-sm text-destructive">
            Erreur lors de la recherche. Reessayez.
          </p>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold">
              {results.length} resultat{results.length > 1 ? "s" : ""}
            </h2>
            {results.map((travel, i) => (
              <Link
                key={i}
                href={`/booking/${travel.id as string}`}
                className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {new Date(
                          travel.departureDateTime as string,
                        ).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {
                          (
                            travel.departureStation as Record<string, unknown>
                          )?.label as string
                        }
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {travel.duration as string}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {new Date(
                          travel.arrivalDateTime as string,
                        ).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {
                          (travel.arrivalStation as Record<string, unknown>)
                            ?.label as string
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-muted-foreground">
                      {travel.trainNumber as string}
                    </span>
                    <p
                      className={`text-xs font-bold ${travel.status === "AVAILABLE" ? "text-green-600" : "text-destructive"}`}
                    >
                      {travel.status === "AVAILABLE"
                        ? "Disponible"
                        : "Complet"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {searchMutation.isSuccess && results.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun train disponible pour cette date
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
