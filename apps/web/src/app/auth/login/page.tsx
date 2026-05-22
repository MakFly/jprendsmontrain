"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Train } from "lucide-react";

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:3333";

export default function LoginPage() {
  const router = useRouter();
  const { status, checkStatus } = useAuthStore();

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  function handleLogin() {
    window.location.href = `${PROXY_URL}/bridge/login`;
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
          <button
            onClick={handleLogin}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-sncf-navy px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            Se connecter via SNCF
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Vous serez redirige vers le site SNCF pour vous connecter en toute securite
        </p>
      </div>
    </div>
  );
}
