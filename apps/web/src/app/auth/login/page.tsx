"use client";

import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { Train } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaUrl, setCaptchaUrl] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.init();
      if ("redirectToConnectUri" in data) {
        window.location.href = data.redirectToConnectUri;
      }
    } catch (err) {
      if (err instanceof Error && err.message === "Captcha required") {
        setError("Verification requise. Veuillez resoudre le captcha.");
      } else {
        setError("Impossible de se connecter. Reessayez.");
      }
      setLoading(false);
    }
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
            disabled={loading}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-sncf-navy px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "Se connecter"
            )}
          </button>

          <button
            onClick={() =>
              authApi.init().then((d) => {
                if ("redirectToCreateUri" in d)
                  window.location.href = d.redirectToCreateUri;
              })
            }
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Creer un compte
          </button>
        </div>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        {captchaUrl && (
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              src={captchaUrl}
              className="h-80 w-full border-0"
              title="Verification DataDome"
            />
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Connexion via Mon Identifiant SNCF
        </p>
      </div>
    </div>
  );
}
