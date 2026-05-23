"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Train, CreditCard, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/search", icon: Search, label: "Recherche" },
  { href: "/trips", icon: Train, label: "Voyages" },
  { href: "/subscription", icon: CreditCard, label: "Abo" },
  { href: "/profile", icon: User, label: "Profil" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around px-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="group flex min-h-[3.25rem] flex-1 select-none flex-col items-center justify-center gap-1 py-1.5"
            >
              <span
                className={cn(
                  "flex h-7 w-14 items-center justify-center rounded-full transition-colors duration-200",
                  active && "bg-sncf-navy/10 dark:bg-sky-400/15",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active
                      ? "text-sncf-navy dark:text-sky-400"
                      : "text-muted-foreground group-active:text-foreground",
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
              </span>
              <span
                className={cn(
                  "text-[0.7rem] leading-none transition-colors",
                  active
                    ? "font-semibold text-sncf-navy dark:text-sky-400"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
