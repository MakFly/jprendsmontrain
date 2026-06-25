"use client";

import Link from "next/link";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export function SessionModeBanner() {
  const { mode } = useAuthStore();
  const sessionAlert = useAuthStore((s) => s.sessionAlert);

  // When a disconnection/captcha alert is up, the red SessionAlert already tells
  // the story. Don't also claim the session is "live" — that contradiction
  // ("live active" + "expired") is exactly what made the UX feel broken.
  if (sessionAlert) return null;

  if (mode === "live") {
    return (
      <div className="border-b border-emerald-600/20 bg-emerald-600/10 px-4 py-2 text-xs text-emerald-700 dark:text-emerald-300">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Session SNCF live active: les actions sont envoyees au compte SNCF.</span>
        </div>
      </div>
    );
  }

  if (mode === "imported") {
    return (
      <div className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs text-amber-800 dark:text-amber-200">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          <span>
            Apercu importe: lecture OK, reservation/annulation seulement apres{" "}
            <Link href="/auth/login" className="font-semibold underline underline-offset-2">
              connexion live SNCF
            </Link>
            .
          </span>
        </div>
      </div>
    );
  }

  return null;
}
