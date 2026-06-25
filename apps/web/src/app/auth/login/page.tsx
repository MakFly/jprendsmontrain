"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Train } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIRROR_URL = process.env.NEXT_PUBLIC_MIRROR_URL || "http://localhost:3344";
const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:3333";

export default function LoginPage() {
  const router = useRouter();
  const { status, mode, checkStatus } = useAuthStore();

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, mode, router]);

  function handleLogin() {
    // Mobile login: open the SNCF site served through our whole-origin mirror.
    // The user logs in there; the mirror captures auth+datadome and the
    // "revenir à MAX SNCF" button hands a ready session back to the PWA.
    window.location.href = `${MIRROR_URL}/sncf-connect`;
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sncf-navy">
            <Train className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">MAX SNCF</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerez votre abonnement MAX Actif
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {mode === "imported" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              Vous etes en apercu importe. Pour reserver ou annuler sur le compte SNCF,
              connectez une session live.
            </div>
          )}

          <Button
            onClick={handleLogin}
            className="w-full rounded-xl"
          >
            Se connecter en live SNCF
          </Button>

          {/* Fallback when the mirror flow is blocked by DataDome: the proxy's
              copy-paste-code page logs in without going through the mirror. */}
          <a
            href={`${PROXY_URL}/bridge/login`}
            className="block text-center text-xs text-muted-foreground underline underline-offset-2"
          >
            Connexion bloquee ? Methode alternative (coller le code)
          </a>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          La session live garde les cookies SNCF cote proxy pour rechercher,
          reserver, annuler et rafraichir automatiquement.
        </p>
      </div>
    </div>
  );
}
