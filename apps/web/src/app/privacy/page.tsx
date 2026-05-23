import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialite — MAX SNCF",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-background text-[14px] leading-relaxed sm:shadow-2xl sm:shadow-black/10">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/dashboard"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground"
        >
          ← Retour
        </Link>
        <h1 className="font-display text-base font-bold">Confidentialite</h1>
      </header>

      <main className="flex-1 space-y-6 px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">
            Politique de confidentialite
          </h2>
          <p className="text-xs text-muted-foreground">
            Derniere mise a jour : 23 mai 2026
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold">1. Responsable du traitement</h3>
          <p className="text-sm text-muted-foreground">
            MAX SNCF est un outil personnel de gestion d&apos;abonnement. Il
            agit comme proxy entre votre appareil et les serveurs SNCF. Aucune
            entreprise ne commercialise ce service.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold">2. Donnees collectees</h3>
          <div className="rounded-xl border border-border p-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-2 font-semibold">Donnee</th>
                  <th className="pb-2 pr-2 font-semibold">Stockage</th>
                  <th className="pb-2 font-semibold">Duree</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-2">Cookie de session</td>
                  <td className="py-2 pr-2">Serveur (memoire)</td>
                  <td className="py-2">24h</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-2">Cookies SNCF (auth, datadome)</td>
                  <td className="py-2 pr-2">Serveur (fichier)</td>
                  <td className="py-2">24h</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-2">Donnees SNCF (voyages, abo)</td>
                  <td className="py-2 pr-2">Navigateur (cache)</td>
                  <td className="py-2">Session</td>
                </tr>
                <tr>
                  <td className="py-2 pr-2">Etat d&apos;authentification</td>
                  <td className="py-2 pr-2">Navigateur (localStorage)</td>
                  <td className="py-2">Persistent</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold">3. Ce que nous ne faisons PAS</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-emerald-600">✗</span> Aucun cookie de tracking ou publicitaire</li>
            <li className="flex gap-2"><span className="text-emerald-600">✗</span> Aucun outil d&apos;analytics (Google Analytics, etc.)</li>
            <li className="flex gap-2"><span className="text-emerald-600">✗</span> Aucune transmission a des tiers</li>
            <li className="flex gap-2"><span className="text-emerald-600">✗</span> Aucun stockage de mots de passe SNCF</li>
            <li className="flex gap-2"><span className="text-emerald-600">✗</span> Aucune collecte d&apos;adresse IP</li>
            <li className="flex gap-2"><span className="text-emerald-600">✗</span> Aucun profilage ou decision automatisee</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold">4. Base legale (RGPD art. 6)</h3>
          <p className="text-sm text-muted-foreground">
            Le traitement repose sur votre <strong>consentement</strong> (art. 6.1.a)
            lorsque vous vous connectez via le proxy, et sur l&apos;<strong>interet
            legitime</strong> (art. 6.1.f) pour le fonctionnement technique
            de l&apos;application (cookie de session).
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold">5. Cookies utilises</h3>
          <div className="rounded-xl border border-border p-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-2 font-semibold">Nom</th>
                  <th className="pb-2 pr-2 font-semibold">Type</th>
                  <th className="pb-2 font-semibold">Finalite</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr>
                  <td className="py-2 pr-2 font-mono text-[11px]">max-session</td>
                  <td className="py-2 pr-2">Fonctionnel</td>
                  <td className="py-2">Identifie votre session proxy (JWT signe, HttpOnly, Secure)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Aucun cookie tiers, aucun cookie de tracking. Le cookie fonctionnel
            est exempt de consentement prealable (directive ePrivacy, art. 5.3).
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold">6. Stockage local (navigateur)</h3>
          <p className="text-sm text-muted-foreground">
            L&apos;application stocke en <code className="rounded bg-muted px-1 py-0.5 text-xs">localStorage</code> :
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• <code className="rounded bg-muted px-1 py-0.5 text-xs">max-auth-store</code> — etat de connexion (authentifie/non)</li>
            <li>• <code className="rounded bg-muted px-1 py-0.5 text-xs">max-query-cache</code> — cache des donnees SNCF pour usage hors-ligne</li>
            <li>• <code className="rounded bg-muted px-1 py-0.5 text-xs">max-cookie-consent</code> — votre choix de consentement cookies</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Ces donnees restent sur votre appareil et ne sont jamais transmises.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold">7. Securite</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Connexion HTTPS chiffree (TLS 1.2+)</li>
            <li>• Cookies HttpOnly + Secure + SameSite</li>
            <li>• Tokens JWT signes (HS256) avec secret aleatoire</li>
            <li>• Sessions expirees automatiquement (24h)</li>
            <li>• Aucun mot de passe stocke</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold">8. Vos droits (RGPD)</h3>
          <p className="text-sm text-muted-foreground">
            Vous disposez des droits d&apos;acces, de rectification, d&apos;effacement,
            de limitation, de portabilite et d&apos;opposition sur vos donnees.
          </p>
          <p className="text-sm text-muted-foreground">
            Pour exercer vos droits ou supprimer vos donnees :
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• <strong>Deconnexion</strong> : supprime la session serveur et le cookie</li>
            <li>• <strong>Vider le cache</strong> : Parametres navigateur → Donnees du site</li>
            <li>• <strong>Desinstaller la PWA</strong> : supprime toutes les donnees locales</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold">9. Hebergement</h3>
          <p className="text-sm text-muted-foreground">
            L&apos;application est hebergee sur un serveur VPS en Europe.
            Les donnees ne quittent pas l&apos;Union europeenne.
          </p>
        </section>

        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Retour a l&apos;application
          </Link>
        </div>
      </main>
    </div>
  );
}
