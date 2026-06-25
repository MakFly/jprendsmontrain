"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

// Shown when a SNCF read fails (typically a 401 after the captured cookies
// rotated). Replaces a misleading empty/zero state with a clear "reconnect"
// prompt — mirrors the inline block already used on the Trips page.
export function SessionExpiredCard({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
      <ShieldAlert className="mx-auto h-8 w-8 text-red-500" />
      <p className="mt-2 text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Votre session SNCF a expiré. Vos données ne sont pas perdues —{" "}
        <Link
          href="/auth/login"
          className="font-medium text-primary underline underline-offset-2"
        >
          reconnectez-vous
        </Link>{" "}
        pour les réafficher.
      </p>
    </div>
  );
}
