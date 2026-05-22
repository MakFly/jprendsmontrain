"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/": "MAX SNCF",
  "/search": "Rechercher",
  "/trips": "Mes voyages",
  "/subscription": "Abonnement",
  "/invoices": "Factures",
  "/preferences": "Preferences",
  "/profile": "Mon profil",
};

export function Header() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "MAX SNCF";

  return (
    <header className="sticky top-0 z-40 flex h-[var(--navbar-h)] items-center border-b border-border bg-card/95 px-4 backdrop-blur-sm">
      <h1 className="text-lg font-bold text-foreground">{title}</h1>
    </header>
  );
}
