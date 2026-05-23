"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { Suspense } from "react";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Code d'autorisation manquant");
      return;
    }

    authApi
      .callback(code)
      .then((result) => {
        if (result.success) {
          setAuthenticated();
          router.replace("/dashboard");
        } else {
          setError("Echec de l'authentification");
        }
      })
      .catch(() => {
        setError("Erreur lors de la connexion");
      });
  }, [searchParams, router, setAuthenticated]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => router.replace("/auth/login")}
          className="rounded-xl bg-sncf-navy px-6 py-3 font-semibold text-white"
        >
          Retour a la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Connexion en cours...</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
