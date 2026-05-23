"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, TriangleAlert } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import {
  onCaptchaRequired,
  onSessionExpired,
  onSessionOk,
} from "@/lib/api-client";

// App-wide banner driven by the proxy's responses: a 401 (rotated SNCF cookies)
// or a DataDome captcha challenge. Registering the api-client handlers here —
// once, above every authenticated page — means a stale session is surfaced
// everywhere instead of read pages silently rendering an empty state.
export function SessionAlert() {
  const sessionAlert = useAuthStore((s) => s.sessionAlert);
  const notifySessionExpired = useAuthStore((s) => s.notifySessionExpired);
  const notifyCaptcha = useAuthStore((s) => s.notifyCaptcha);
  const clearSessionAlert = useAuthStore((s) => s.clearSessionAlert);

  useEffect(() => {
    onSessionExpired(notifySessionExpired);
    onCaptchaRequired(notifyCaptcha);
    onSessionOk(clearSessionAlert);
  }, [notifySessionExpired, notifyCaptcha, clearSessionAlert]);

  if (!sessionAlert) return null;

  if (sessionAlert.kind === "captcha") {
    return (
      <div className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs text-amber-800 dark:text-amber-200">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            Verification de securite SNCF (DataDome). Le plus fiable :{" "}
            <Link
              href="/auth/login"
              className="font-semibold underline underline-offset-2"
            >
              reconnectez-vous
            </Link>{" "}
            pour rafraichir la session, ou{" "}
            <a
              href={sessionAlert.url}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              resoudre le captcha
            </a>
            .
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-red-500/25 bg-red-500/10 px-4 py-2 text-xs text-red-700 dark:text-red-300">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <TriangleAlert className="h-4 w-4 shrink-0" />
        <span>
          Session SNCF expiree — vos donnees ne peuvent plus etre lues.{" "}
          <Link
            href="/auth/login"
            className="font-semibold underline underline-offset-2"
          >
            Reconnectez-vous
          </Link>
          .
        </span>
      </div>
    </div>
  );
}
