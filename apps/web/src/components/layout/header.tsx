"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const TITLES: Record<string, string> = {
  "/dashboard": "MAX SNCF",
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
    <header className="sticky top-0 z-40 border-b border-border bg-card pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-[var(--navbar-h)] max-w-lg items-center justify-between px-4">
        <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <ThemeToggle />
      </div>
    </header>
  );
}
