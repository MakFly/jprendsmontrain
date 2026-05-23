"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "max-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[2147483646] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-[480px] flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
          Cette application utilise uniquement des{" "}
          <strong className="text-foreground">cookies fonctionnels</strong> (session
          SNCF) — aucun tracking, aucune publicite.{" "}
          <Link
            href="/privacy"
            className="font-medium text-primary underline underline-offset-2"
          >
            Politique de confidentialite
          </Link>
        </p>
        <button
          onClick={accept}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          Compris
        </button>
      </div>
    </div>
  );
}
