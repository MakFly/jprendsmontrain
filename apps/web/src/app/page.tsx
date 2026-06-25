"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { TrainLogo } from "@/components/shared/train-logo";
import { motion, useInView } from "motion/react";
import {
  ArrowRight,
  CalendarDays,
  Gauge,
  Github,
  Lock,
  Moon,
  QrCode,
  Search,
  Server,
  Shield,
  Smartphone,
  Star,
  Train,
  WifiOff,
  Zap,
} from "lucide-react";

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    el.style.transition =
      "opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)";
    el.style.transitionDelay = `${delay}ms`;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

const DOT_GRID = {
  backgroundImage: "radial-gradient(circle, #a8a29e 1px, transparent 1px)",
  backgroundSize: "28px 28px",
} as const;

const features = [
  {
    icon: Search,
    title: "Recherche instantanee",
    desc: "Trouvez et reservez un TGV en quelques secondes. Strip de dates, filtres horaires, disponibilite temps reel.",
  },
  {
    icon: Gauge,
    title: "Dashboard en un coup d'oeil",
    desc: "Reservations restantes, prochains voyages, statut de session — tout sur un seul ecran.",
  },
  {
    icon: Star,
    title: "Favoris one-tap",
    desc: "Vos trajets recurrents configures. Un tap pour reserver votre prochain aller ou retour.",
  },
  {
    icon: CalendarDays,
    title: "Gestion des voyages",
    desc: "Consultez, echangez ou annulez vos reservations. Historique complet accessible.",
  },
  {
    icon: QrCode,
    title: "Carte QR hors ligne",
    desc: "Votre carte d'abonnement avec QR code genere localement. Fonctionne sans reseau.",
  },
  {
    icon: Moon,
    title: "Mode sombre natif",
    desc: "Interface adaptee a votre preference systeme. Concue pour le confort en toute condition.",
  },
];

const archFeatures = [
  {
    icon: Shield,
    title: "Session securisee",
    desc: "JWT cote serveur, cookies httpOnly, TTL 24h, max 5 sessions.",
  },
  {
    icon: Zap,
    title: "Zero latence ajoutee",
    desc: "Le proxy relay transparentement vers l'API SNCF. Pas de cache, pas de tampon.",
  },
  {
    icon: WifiOff,
    title: "PWA offline-ready",
    desc: "Service Worker pour le shell. Carte QR disponible sans reseau.",
  },
];

const privacyItems = [
  {
    label: "Auto-heberge",
    desc: "Docker Compose + Caddy, deploye en 5 minutes sur n'importe quel VPS.",
  },
  {
    label: "Pas de tracking",
    desc: "Zero cookie tiers, zero Google Analytics, zero fingerprinting.",
  },
  {
    label: "Open source",
    desc: "Code auditable. Vous savez exactement ce qui est execute.",
  },
  {
    label: "Usage personnel",
    desc: "Concu pour 1 a 5 utilisateurs max. Pas un service public.",
  },
];

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="h-6 w-[1px] bg-stone-300 dark:bg-stone-700" />
      <span className="rounded-md bg-stone-100 px-2.5 py-1 font-mono text-[10px] font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
        {label}
      </span>
      <div className="h-6 w-[1px] bg-stone-300 dark:bg-stone-700" />
      <div className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-stone-300 dark:border-t-stone-700" />
    </div>
  );
}

const archNodes = [
  {
    id: "pwa",
    icon: Smartphone,
    title: "PWA Next.js",
    sub: "Interface mobile-first installable",
    border: "border-stone-300 dark:border-stone-700",
    bg: "bg-stone-50 dark:bg-stone-800",
  },
  {
    id: "proxy",
    icon: Server,
    title: "Proxy Hono / Bun",
    sub: "Session store · CORS · DataDome relay",
    border: "border-stone-400 dark:border-stone-600",
    bg: "bg-stone-100 dark:bg-stone-800",
  },
  {
    id: "sncf",
    icon: Train,
    title: "API SNCF",
    sub: "maxactif-tgvinoui.sncf · DataDome",
    border: "border-dashed border-stone-300 dark:border-stone-700",
    bg: "bg-stone-50 dark:bg-stone-900",
    muted: true,
  },
] as const;

const archEdges = ["HTTP + JWT", "fetch + cookies SNCF"] as const;

function AnimatedArrow({
  label,
  delay,
}: {
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: "top" }}
    >
      <motion.div
        className="h-6 w-[1px] bg-stone-300 dark:bg-stone-700"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, delay: delay + 0.1, ease: "easeOut" }}
        style={{ transformOrigin: "top" }}
      />
      <motion.span
        className="rounded-md bg-stone-100 px-2.5 py-1 font-mono text-[10px] font-semibold text-stone-500 dark:bg-stone-800 dark:text-stone-400"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.3 }}
      >
        {label}
      </motion.span>
      <motion.div
        className="h-6 w-[1px] bg-stone-300 dark:bg-stone-700"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, delay: delay + 0.4, ease: "easeOut" }}
        style={{ transformOrigin: "top" }}
      />
      <motion.div
        className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-stone-300 dark:border-t-stone-700"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: delay + 0.6 }}
      />
    </motion.div>
  );
}

function ArchitectureDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="mt-12 overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 sm:p-10 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-col items-center gap-6 sm:gap-8">
        {archNodes.map((node, i) => (
          <div key={node.id} className="flex w-full flex-col items-center gap-6 sm:gap-8">
            {i > 0 && isInView && (
              <AnimatedArrow
                label={archEdges[i - 1]!}
                delay={i * 0.5 + 0.2}
              />
            )}
            <motion.div
              className={`w-full max-w-sm rounded-xl border-2 ${node.border} ${node.bg} px-6 py-5 text-center`}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={
                isInView
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 30, scale: 0.95 }
              }
              transition={{
                duration: 0.6,
                delay: i * 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="flex items-center justify-center gap-2.5">
                <node.icon
                  className={`h-5 w-5 ${"muted" in node ? "text-stone-400" : "text-stone-600 dark:text-stone-400"}`}
                />
                <span
                  className={`font-display text-base font-bold ${"muted" in node ? "text-stone-500 dark:text-stone-400" : ""}`}
                >
                  {node.title}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                {node.sub}
              </p>
            </motion.div>
          </div>
        ))}
      </div>

      <motion.div
        className="mt-10 flex flex-wrap justify-center gap-6 border-t border-stone-200 pt-6 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 1.8 }}
      >
        <div className="flex items-center gap-2">
          <div className="h-[2px] w-5 bg-stone-400" />
          <span>Connexion directe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-[2px] w-5 border-t-2 border-dashed border-stone-400" />
          <span>Service tiers</span>
        </div>
      </motion.div>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <hr className="border-stone-200 dark:border-stone-800" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
          style={DOT_GRID}
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <Reveal>
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <TrainLogo className="h-12 w-12 text-stone-700 dark:text-stone-300" />
            </div>
          </Reveal>

          <Reveal delay={100}>
            <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400">
              Application auto-hébergée
            </p>
          </Reveal>

          <Reveal delay={200}>
            <h1
              className="font-display font-extrabold leading-[0.95] tracking-tight text-stone-900 dark:text-stone-50"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
            >
              MAX SNCF.
              <br />
              <span className="text-stone-400 dark:text-stone-600">
                Repensé.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={350}>
            <p
              className="mx-auto mt-8 max-w-lg text-stone-600 dark:text-stone-400"
              style={{
                fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
                lineHeight: 1.7,
              }}
            >
              Gérez votre abonnement MAX Actif TGV INOUI depuis une interface
              rapide, épurée et installable. Hébergée chez vous. Vos données
              restent les vôtres.
            </p>
          </Reveal>

          <Reveal delay={500}>
            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard"
                className="group inline-flex min-h-[48px] items-center gap-2.5 rounded-xl bg-stone-900 px-7 text-sm font-semibold text-white transition-all hover:bg-stone-800 active:scale-[0.98] dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
              >
                Accéder au tableau de bord
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#features"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-stone-300 px-7 text-sm font-semibold text-stone-700 transition-all hover:border-stone-400 hover:bg-stone-100 active:scale-[0.98] dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:bg-stone-900"
              >
                En savoir plus
              </a>
            </div>
          </Reveal>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="h-10 w-[1px] bg-gradient-to-b from-stone-400 to-transparent dark:from-stone-600" />
        </div>
      </section>

      <SectionDivider />

      {/* ── Problem ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <Reveal className="lg:col-span-2">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-stone-400 dark:text-stone-500">
              Le constat
            </p>
            <h2
              className="mt-4 font-display font-bold leading-tight tracking-tight"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              L&apos;app officielle n&apos;est pas faite pour le quotidien.
            </h2>
          </Reveal>

          <Reveal delay={150} className="lg:col-span-3">
            <div
              className="space-y-6 text-stone-600 dark:text-stone-400"
              style={{
                fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
                lineHeight: 1.8,
              }}
            >
              <p>
                L&apos;abonnement MAX Actif permet de reserver des TGV
                illimites sur un trajet domicile-travail fixe. Mais
                l&apos;application SNCF est lourde, lente, et concue pour tous
                les voyageurs &mdash; pas pour les navetteurs quotidiens.
              </p>
              <p>
                Cette PWA est nee d&apos;un besoin simple&nbsp;:{" "}
                <strong className="text-stone-900 dark:text-stone-200">
                  reserver un train en 10 secondes depuis son telephone
                </strong>
                , sans naviguer dans des menus inutiles, sans attendre des
                ecrans de chargement, sans rouvrir l&apos;app trois fois par
                jour.
              </p>
              <p>
                Un outil personnel, construit pour un usage precis, pense pour
                la vitesse.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <SectionDivider />

      {/* ── Features ─────────────────────────────────────────── */}
      <section
        id="features"
        className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24 lg:py-32"
      >
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-stone-400 dark:text-stone-500">
            Fonctionnalites
          </p>
          <h2
            className="mt-4 max-w-xl font-display font-bold leading-tight tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
          >
            Tout ce qu&apos;il faut. Rien de superflu.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 sm:grid-cols-2 lg:grid-cols-3 dark:border-stone-800 dark:bg-stone-800">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="flex h-full flex-col bg-stone-50 p-8 dark:bg-stone-950">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                    <f.icon className="h-5 w-5 text-stone-600 dark:text-stone-400" />
                  </div>
                  <span className="font-mono text-xs font-bold text-stone-300 dark:text-stone-700">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">
                  {f.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* ── Architecture ─────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-24 lg:py-32">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-stone-400 dark:text-stone-500">
            Architecture
          </p>
          <h2
            className="mt-4 max-w-xl font-display font-bold leading-tight tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
          >
            Comment ça fonctionne.
          </h2>
        </Reveal>

        <ArchitectureDiagram />

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {archFeatures.map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
                <item.icon className="h-5 w-5 text-stone-500 dark:text-stone-400" />
                <h3 className="mt-3 font-display font-bold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  {item.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* ── Privacy ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-stone-400 dark:text-stone-500">
              Vie privee
            </p>
            <h2
              className="mt-4 font-display font-bold leading-tight tracking-tight"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              Vos donnees restent chez vous.
            </h2>
            <p
              className="mt-6 text-stone-600 dark:text-stone-400"
              style={{
                fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
                lineHeight: 1.8,
              }}
            >
              Aucune base de donnees externe, aucun analytics tiers, aucune
              telemetrie. L&apos;application tourne sur votre propre serveur,
              derriere votre propre domaine. Les sessions sont stockees sur
              votre serveur et expirent automatiquement.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="space-y-4">
              {privacyItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-4 rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
                >
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
                  <div>
                    <p className="font-display text-sm font-bold">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900">
        <div
          className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-15"
          style={DOT_GRID}
        />

        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center lg:py-32">
          <Reveal>
            <h2
              className="font-display font-extrabold tracking-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              Pret a embarquer&nbsp;?
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p
              className="mx-auto mt-4 max-w-md text-stone-600 dark:text-stone-400"
              style={{
                fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
                lineHeight: 1.7,
              }}
            >
              Deployez votre instance en quelques minutes. Reprenez le controle
              de votre experience MAX Actif.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-10">
              <Link
                href="/dashboard"
                className="group inline-flex min-h-[48px] items-center gap-2.5 rounded-xl bg-stone-900 px-8 text-sm font-semibold text-white transition-all hover:bg-stone-800 active:scale-[0.98] dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
              >
                Se connecter
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-stone-200 bg-stone-50 pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <Train className="h-4 w-4 text-stone-400" />
            <span className="font-display text-sm font-bold text-stone-500">
              MAX SNCF
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/MakFly/pwa-max-sncf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-stone-400 transition-colors hover:text-stone-600 dark:hover:text-stone-300"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Projet open source &middot; Non affilié à la SNCF
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
