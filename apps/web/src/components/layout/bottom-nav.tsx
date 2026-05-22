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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs transition-colors",
                active
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
