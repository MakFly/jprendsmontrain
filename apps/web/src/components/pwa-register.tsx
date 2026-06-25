"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

// Build-time version (next.config). Appended to the SW URL so each deploy is a
// distinct registration the browser detects as an update.
const SW_VERSION = process.env.NEXT_PUBLIC_SW_VERSION || "dev";

export function PwaRegister() {
  // The installed-but-waiting worker, once a new version is ready to take over.
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Only a controller-replacement (an UPDATE) should reload — never the very
    // first install, which has no prior controller and is already current.
    const hadController = !!navigator.serviceWorker.controller;
    let registration: ServiceWorkerRegistration | null = null;
    let reloading = false;

    // Surface the prompt only for an update (installed + a controller exists),
    // not for the initial install.
    const promote = (sw: ServiceWorker | null) => {
      if (sw && sw.state === "installed" && navigator.serviceWorker.controller) {
        setWaiting(sw);
      }
    };

    const onLoad = () => {
      navigator.serviceWorker
        .register(`/sw.js?v=${SW_VERSION}`)
        .then((reg) => {
          registration = reg;
          promote(reg.waiting);
          reg.addEventListener("updatefound", () => {
            const installing = reg.installing;
            installing?.addEventListener("statechange", () =>
              promote(installing),
            );
          });
        })
        .catch(() => {
          /* SW registration is best-effort */
        });
    };

    const onControllerChange = () => {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);

    // While the app stays open, poll for a newer deploy hourly.
    const interval = window.setInterval(
      () => registration?.update().catch(() => {}),
      60 * 60 * 1000,
    );

    return () => {
      window.removeEventListener("load", onLoad);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      window.clearInterval(interval);
    };
  }, []);

  if (!waiting) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
        <RefreshCw className="h-4 w-4 shrink-0 text-primary" />
        <p className="min-w-0 flex-1 text-sm">
          Nouvelle version disponible.
        </p>
        <button
          onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}
          className="shrink-0 rounded-lg bg-sncf-navy px-3 py-1.5 text-sm font-semibold text-white active:scale-[0.98]"
        >
          Recharger
        </button>
      </div>
    </div>
  );
}
