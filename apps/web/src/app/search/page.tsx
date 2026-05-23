"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reservationApi } from "@/lib/api/reservation";
import { refdataApi } from "@/lib/api/refdata";
import {
  ArrowLeftRight,
  Check,
  ChevronRight,
  Loader2,
  Search as SearchIcon,
  Star,
  Train,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";

type Station = { code: string; label: string };
type Travel = Record<string, unknown>;
type PrefLeg = {
  originLabel: string;
  originCode: string;
  destinationLabel: string;
  destinationCode: string;
  time: string;
};
type Pref = {
  day: string;
  dayIndex: number;
  outbound: PrefLeg;
  return: PrefLeg;
};

const DAY_SHORT = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const TIME_CHIPS = ["06h00", "06h30", "07h00", "08h00", "16h00", "16h30", "17h00", "18h00"];

function iso(d: Date) {
  // LOCAL calendar date — NOT toISOString(), which converts to UTC and, in a
  // positive-offset zone (e.g. CEST = UTC+2), rolls back to the previous day.
  // That made the chip you tapped ("26") send the day before ("25") to SNCF.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function localDate(s: string) {
  // Parse a "YYYY-MM-DD" string as a LOCAL date. `new Date("2026-05-25")`
  // parses as UTC midnight, which renders as the previous day in negative-UTC
  // zones — so build it from local parts instead.
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}
function hm(value: unknown) {
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function nextDateForWeekday(dayIndex: number) {
  // dayIndex: 1=Mon..7=Sun (SNCF). JS getDay(): 0=Sun..6=Sat
  const jsTarget = dayIndex % 7;
  const d = new Date();
  const diff = (jsTarget - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return iso(d);
}

export default function SearchPage() {
  const queryClient = useQueryClient();
  const [origin, setOrigin] = useState<Station | null>(null);
  const [destination, setDestination] = useState<Station | null>(null);
  const [date, setDate] = useState(iso(new Date()));
  const [time, setTime] = useState("06h30");
  // `picker`/`confirm` hold the data; the `*Open` booleans drive the Vaul
  // drawer. Keeping them separate lets the content stay rendered through the
  // close animation instead of blanking mid-slide.
  const [picker, setPicker] = useState<"origin" | "destination" | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirm, setConfirm] = useState<Travel | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bookedRef, setBookedRef] = useState<string | null>(null);

  const { data: stationsData } = useQuery({
    queryKey: ["stations"],
    queryFn: refdataApi.getStations,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const { data: prefData } = useQuery({
    queryKey: ["preferences"],
    queryFn: reservationApi.readPreferences,
  });
  const stations = (stationsData?.stations ?? []) as Station[];
  const prefs = ((prefData as { preferences?: Pref[] })?.preferences ?? []) as Pref[];

  const search = useMutation({ mutationFn: reservationApi.searchTravels });
  const book = useMutation({
    mutationFn: (travelId: string) => reservationApi.bookTravel({ travelId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips"] }),
  });

  const results = (search.data?.travels ?? []) as Travel[];

  const dates = useMemo(() => {
    const out: Date[] = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  function runSearch(o: Station, d: Station, dt: string, t: string) {
    setConfirm(null);
    setBookedRef(null);
    book.reset();
    search.mutate({
      origin: o.code,
      destination: d.code,
      departureDate: dt,
      preferredTime: t,
    });
  }

  function launchFavorite(leg: PrefLeg, dayIndex: number) {
    const o = { code: leg.originCode, label: leg.originLabel };
    const d = { code: leg.destinationCode, label: leg.destinationLabel };
    const dt = nextDateForWeekday(dayIndex);
    setOrigin(o);
    setDestination(d);
    setDate(dt);
    setTime(leg.time);
    runSearch(o, d, dt, leg.time);
  }

  function manualSearch() {
    if (origin && destination) runSearch(origin, destination, date, time);
  }

  function swap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function openPicker(which: "origin" | "destination") {
    setPicker(which);
    setPickerOpen(true);
  }

  function pick(s: Station) {
    if (picker === "origin") setOrigin(s);
    else if (picker === "destination") setDestination(s);
    setPickerOpen(false);
  }

  function openConfirm(t: Travel) {
    book.reset();
    setBookedRef(null);
    setConfirm(t);
    setConfirmOpen(true);
  }

  return (
    <AppShell>
      <div className="-mx-4 -mt-4">
        {/* ── Composer ─────────────────────────────────────────────── */}
        <section className="surface-rail grain relative overflow-hidden px-4 pb-6 pt-5 text-white">
          <div className="relative z-10 mx-auto max-w-lg">
            <div className="mb-4 flex items-center gap-2">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-sncf-red" />
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/60">
                Réserver un trajet
              </span>
            </div>

            {/* trajectory */}
            <div className="relative rounded-2xl bg-white/[0.06] p-1.5 ring-1 ring-white/10 backdrop-blur-sm">
              <StationField
                hint="Départ"
                station={origin}
                onClick={() => openPicker("origin")}
              />
              <div className="my-1 h-px bg-white/10" />
              <StationField
                hint="Arrivée"
                station={destination}
                onClick={() => openPicker("destination")}
              />
              <button
                type="button"
                onClick={swap}
                aria-label="Inverser les gares"
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-sncf-red text-white shadow-lg shadow-black/30 transition-transform active:rotate-180"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            </div>

            {/* date strip */}
            <div className="mt-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {dates.map((d) => {
                const value = iso(d);
                const active = value === date;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDate(value)}
                    className={cn(
                      "flex min-w-[3.25rem] shrink-0 flex-col items-center rounded-xl px-2 py-2 transition-colors",
                      active
                        ? "bg-white text-sncf-navy"
                        : "bg-white/[0.06] text-white/70 hover:bg-white/10",
                    )}
                  >
                    <span className="text-[0.65rem] font-medium uppercase">
                      {DAY_SHORT[d.getDay()]}
                    </span>
                    <span className="tnum font-display text-lg font-bold leading-none">
                      {d.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* time chips */}
            <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TIME_CHIPS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={cn(
                    "tnum shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    t === time
                      ? "bg-sncf-red text-white"
                      : "bg-white/[0.06] text-white/70 hover:bg-white/10",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={manualSearch}
              disabled={!origin || !destination || search.isPending}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-white font-display text-base font-bold text-sncf-navy transition-all active:scale-[0.98] disabled:opacity-40"
            >
              {search.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <SearchIcon className="h-4 w-4" strokeWidth={2.5} />
                  Rechercher
                </>
              )}
            </button>
          </div>
        </section>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-lg px-4 pt-5">
          {/* favorites */}
          {prefs.length > 0 && !search.data && !search.isPending && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2 px-0.5">
                <Star className="h-4 w-4 fill-sncf-red text-sncf-red" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wide">
                  Mes trajets favoris
                </h2>
                <span className="text-xs text-muted-foreground">· 1 tap</span>
              </div>
              {prefs.map((p, i) => (
                <button
                  key={p.dayIndex}
                  type="button"
                  onClick={() => launchFavorite(p.outbound, p.dayIndex)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="rise group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition-colors hover:border-sncf-navy/30 hover:bg-muted/60"
                >
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-sncf-navy text-white">
                    <span className="text-[0.6rem] font-medium uppercase leading-none opacity-70">
                      {p.day.slice(0, 3)}
                    </span>
                    <span className="tnum font-mono text-[0.7rem] font-bold leading-tight">
                      {p.outbound.time}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold leading-tight">
                      {p.outbound.originLabel}
                      <span className="mx-1.5 text-muted-foreground">→</span>
                      {p.outbound.destinationLabel}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Prochain {p.day.toLowerCase()} · départ {p.outbound.time}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </section>
          )}

          {/* loading board */}
          {search.isPending && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="skeleton-sweep h-[5.5rem] rounded-2xl border border-border bg-card"
                />
              ))}
            </div>
          )}

          {/* results */}
          {search.isSuccess && (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between px-0.5">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide">
                  {results.length > 0
                    ? `${results.length} train${results.length > 1 ? "s" : ""}`
                    : "Aucun train"}
                </h2>
                {origin && destination && (
                  <span className="text-xs text-muted-foreground">
                    {localDate(date).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>

              {results.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <Train className="mx-auto h-7 w-7 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Pas de train pour ce créneau. Essayez une autre heure.
                  </p>
                </div>
              )}

              {results.map((t, i) => (
                <TrainCard
                  key={String(t.id)}
                  travel={t}
                  index={i}
                  onSelect={() => openConfirm(t)}
                />
              ))}
            </section>
          )}

          {search.isError && (
            <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-center text-sm text-destructive">
              Recherche impossible pour le moment. Réessayez.
            </p>
          )}
        </div>
      </div>

      {/* ── Station picker drawer (Vaul) ───────────────────────────── */}
      <Drawer open={pickerOpen} onOpenChange={(o) => setPickerOpen(o)}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader>
            <DrawerTitle>
              {picker === "destination" ? "Gare d'arrivée" : "Gare de départ"}
            </DrawerTitle>
          </DrawerHeader>
          <StationPicker stations={stations} onPick={pick} />
        </DrawerContent>
      </Drawer>

      {/* ── Booking confirm drawer (Vaul) ──────────────────────────── */}
      <Drawer
        open={confirmOpen}
        onOpenChange={(o) => {
          if (!o) {
            setConfirmOpen(false);
            book.reset();
            setBookedRef(null);
          }
        }}
      >
        <DrawerContent>
          {confirm && (
            <ConfirmBody
              travel={confirm}
              pending={book.isPending}
              error={book.isError}
              bookedRef={bookedRef}
              onConfirm={() =>
                book.mutate(String(confirm.id), {
                  onSuccess: () =>
                    setBookedRef(
                      String(
                        (confirm.reservationId as string) ??
                          confirm.trainNumber ??
                          "OK",
                      ),
                    ),
                })
              }
              onClose={() => setConfirmOpen(false)}
            />
          )}
        </DrawerContent>
      </Drawer>
    </AppShell>
  );
}

/* ── Sub-components ───────────────────────────────────────────────── */

function StationField({
  hint,
  station,
  onClick,
}: {
  hint: string;
  station: Station | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
    >
      <span className="h-2 w-2 shrink-0 rounded-full border-2 border-white/50" />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.65rem] font-semibold uppercase tracking-wider text-white/45">
          {hint}
        </span>
        <span
          className={cn(
            "block truncate font-display text-lg font-bold leading-tight",
            station ? "text-white" : "text-white/40",
          )}
        >
          {station?.label ?? "Choisir une gare"}
        </span>
      </span>
    </button>
  );
}

function TrainCard({
  travel,
  index,
  onSelect,
}: {
  travel: Travel;
  index: number;
  onSelect: () => void;
}) {
  const dep = travel.departureStation as Station;
  const arr = travel.arrivalStation as Station;
  const available = travel.status === "AVAILABLE" || travel.status === "CONFIRMED";
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ animationDelay: `${index * 70}ms` }}
      className="board-flip flex w-full items-stretch gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex flex-col items-end">
        <span className="tnum font-mono text-xl font-bold leading-none">
          {hm(travel.departureDateTime)}
        </span>
        <span className="mt-1 max-w-[5.5rem] truncate text-[0.7rem] text-muted-foreground">
          {dep?.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-1">
        <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
          {String(travel.duration ?? "")}
        </span>
        <div className="my-1 flex w-full items-center">
          <span className="h-1.5 w-1.5 rounded-full bg-sncf-navy" />
          <span className="h-px flex-1 bg-gradient-to-r from-sncf-navy/40 to-sncf-red/40" />
          <Train className="h-3.5 w-3.5 text-sncf-red" />
        </div>
        <span className="font-mono text-[0.65rem] text-muted-foreground">
          {String(travel.carrier ?? "TGV")} · {String(travel.trainNumber ?? "")}
        </span>
      </div>

      <div className="flex flex-col items-start">
        <span className="tnum font-mono text-xl font-bold leading-none">
          {hm(travel.arrivalDateTime)}
        </span>
        <span className="mt-1 max-w-[5.5rem] truncate text-[0.7rem] text-muted-foreground">
          {arr?.label}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center pl-1">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            available ? "bg-emerald-500" : "bg-destructive",
          )}
        />
        <span
          className={cn(
            "mt-1 text-[0.6rem] font-bold uppercase",
            available ? "text-emerald-600" : "text-destructive",
          )}
        >
          {available ? "Libre" : "Complet"}
        </span>
      </div>
    </button>
  );
}

const STATION_PAGE = 15;

function StationPicker({
  stations,
  onPick,
}: {
  stations: Station[];
  onPick: (s: Station) => void;
}) {
  // Infinite scroll: the SNCF referential is ~7000 stations — rendering them
  // all freezes the drawer. Show 15, then load 15 more as a sentinel scrolls
  // into view. Resets to 15 on each open (the picker remounts with the drawer).
  const [count, setCount] = useState(STATION_PAGE);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((c) => Math.min(c + STATION_PAGE, stations.length));
        }
      },
      { root: scrollRef.current, rootMargin: "240px" },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [stations.length]);

  const visible = stations.slice(0, count);

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      {stations.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
          Aucune gare
        </p>
      ) : (
        <>
          {visible.map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => onPick(s)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-muted active:bg-muted"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sncf-navy/40" />
              <span className="flex-1 truncate">{s.label}</span>
              <span className="font-mono text-[0.65rem] text-muted-foreground">
                {s.code}
              </span>
            </button>
          ))}
          {count < stations.length && (
            <div ref={sentinelRef} className="h-10" aria-hidden />
          )}
        </>
      )}
    </div>
  );
}

function ConfirmBody({
  travel,
  pending,
  error,
  bookedRef,
  onConfirm,
  onClose,
}: {
  travel: Travel;
  pending: boolean;
  error: boolean;
  bookedRef: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dep = travel.departureStation as Station;
  const arr = travel.arrivalStation as Station;

  if (bookedRef) {
    return (
      <>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Réservation confirmée</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col items-center px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
            <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold">Réservé !</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Dossier{" "}
            <span className="font-mono font-bold text-foreground">{bookedRef}</span>{" "}
            · ajouté à vos voyages.
          </p>
          <div className="mt-5 flex w-full gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] flex-1 rounded-xl border border-border text-sm font-semibold active:bg-muted"
            >
              Continuer
            </button>
            <Link
              href="/trips"
              className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-sncf-navy text-sm font-semibold text-white active:scale-[0.98]"
            >
              Mes voyages
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Confirmer le trajet</DrawerTitle>
      </DrawerHeader>

      <div className="px-5">
        <div className="ticket-notch rounded-2xl border border-dashed border-border bg-muted/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="tnum font-mono text-2xl font-bold">
                {hm(travel.departureDateTime)}
              </p>
              <p className="text-xs text-muted-foreground">{dep?.label}</p>
            </div>
            <div className="px-2 text-center">
              <p className="text-[0.65rem] uppercase text-muted-foreground">
                {String(travel.duration ?? "")}
              </p>
              <Train className="mx-auto mt-1 h-4 w-4 text-sncf-red" />
            </div>
            <div className="text-right">
              <p className="tnum font-mono text-2xl font-bold">
                {hm(travel.arrivalDateTime)}
              </p>
              <p className="text-xs text-muted-foreground">{arr?.label}</p>
            </div>
          </div>
          <div className="mt-3 border-t border-dashed border-border pt-2 text-center font-mono text-[0.7rem] text-muted-foreground">
            {String(travel.carrier ?? "TGV INOUI")} · N°
            {String(travel.trainNumber ?? "")}
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-destructive/10 p-2 text-center text-xs text-destructive">
            Réservation refusée. Relancez la recherche puis réessayez.
          </p>
        )}
      </div>

      <DrawerFooter>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-sncf-red font-display text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Réserver ce trajet"
          )}
        </button>
        <p className="text-center text-[0.7rem] text-muted-foreground">
          Réservation incluse dans votre abonnement MAX Actif.
        </p>
      </DrawerFooter>
    </>
  );
}
