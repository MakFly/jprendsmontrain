# DESIGN — Landing Page `/`

Direction esthetique : **Technical Parchment**
Inspiration : Kinfolk magazine, Aesop, Muji — minimalisme editorial avec des tons chauds.

---

## Direction artistique

La landing page adopte un style editorial premium, sobre et chaleureux.
L'idee est de communiquer la precision technique du projet tout en restant
accueillant et lisible. Aucune couleur SNCF (bleu marine, rouge) n'est
utilisee — le theme est entierement neutral stone.

Mots-cles : **editorial, magazine, minimalisme chaud, papier technique, sobre**.

---

## Palette de couleurs — Stone Neutral

Basee sur la palette `stone` de Tailwind CSS (sous-tons chauds, 20-40deg hue).

### Light mode

| Role              | Token          | Hex       | HSL approx         |
|-------------------|----------------|-----------|---------------------|
| Background        | `stone-50`     | `#fafaf9` | `40 11% 98%`       |
| Foreground        | `stone-900`    | `#1c1917` | `24 10% 10%`       |
| Muted text        | `stone-500`    | `#78716c` | `25 5% 45%`        |
| Borders           | `stone-200`    | `#e7e5e4` | `20 6% 90%`        |
| Cards             | `white`        | `#ffffff` | -                   |
| Card borders      | `stone-200`    | `#e7e5e4` | `20 6% 90%`        |
| CTA primary bg    | `stone-900`    | `#1c1917` | `24 10% 10%`       |
| CTA primary text  | `white`        | `#ffffff` | -                   |
| CTA secondary     | border `stone-300`, text `stone-700` | | |
| Section labels    | `stone-400`    | `#a8a29e` | monospace uppercase |
| Feature ordinals  | `stone-300`    | `#d6d3d1` | monospace bold      |
| Dot grid (hero)   | `stone-400`    | `#a8a29e` | 1px dots, 28px grid |

### Dark mode

| Role              | Token          | Hex       |
|-------------------|----------------|-----------|
| Background        | `stone-950`    | `#0c0a09` |
| Foreground        | `stone-100`    | `#f5f5f4` |
| Muted text        | `stone-400`    | `#a8a29e` |
| Borders           | `stone-800`    | `#292524` |
| Cards             | `stone-900`    | `#1c1917` |
| CTA primary bg    | `stone-100`    | `#f5f5f4` |
| CTA primary text  | `stone-900`    | `#1c1917` |
| Dot grid          | `stone-400` a `opacity-20` |

### Couleurs semantiques (conservees)

| Role        | Light                 | Dark                  |
|-------------|----------------------|------------------------|
| Success     | `emerald-600`        | `emerald-300`          |
| Warning     | `amber-500`          | `amber-200`            |
| Error       | `red-500`            | `red-300`              |
| Destructive | `hsl(0 72% 51%)`    | `hsl(0 63% 31%)`      |

---

## Typographie

Trois familles chargees via `next/font/google` :

| Role       | Font                  | Poids           | Usage                             |
|------------|-----------------------|-----------------|-----------------------------------|
| Display    | **Bricolage Grotesque** | 600, 700, 800 | Titres, h1-h3, labels de nav      |
| Body       | **Hanken Grotesk**    | 400-700         | Paragraphes, descriptions          |
| Mono       | **JetBrains Mono**    | 500, 600, 700   | Labels de section, ordinals, tags |

### Fluid typography

Tous les titres utilisent `clamp()` pour un scaling fluide :

```
Hero h1:       clamp(2.5rem, 7vw, 5rem)
Section h2:    clamp(1.75rem, 3.5vw, 2.5rem)
CTA h2:        clamp(2rem, 5vw, 3.5rem)
Body:          clamp(0.95rem, 1.2vw, 1.1rem)
Subtitle:      clamp(1rem, 1.5vw, 1.25rem)
```

### Hierarchie typographique

- **Section labels** : `font-mono text-xs uppercase tracking-[0.25em] text-stone-400`
- **Titres** : `font-display font-bold tracking-tight`
- **Body** : `text-stone-600 dark:text-stone-400`, line-height 1.7-1.8
- **Ordinals** : `font-mono text-xs font-bold text-stone-300` (ex: "01", "02")

---

## Structure de la page

```
┌─────────────────────────────────────────────────────────────────┐
│                         HERO (100dvh)                           │
│                                                                 │
│     ┌─────┐                                                     │
│     │ 🚂  │  icon Train dans boite stone-200 bordee             │
│     └─────┘                                                     │
│                                                                 │
│     PROGRESSIVE WEB APP          ← mono, uppercase, tracking    │
│                                                                 │
│     Votre MAX SNCF,             ← display, clamp(2.5rem, 7vw)  │
│     reinvente.                  ← stone-400 (attenue)           │
│                                                                 │
│     Tagline descriptive...       ← body, max-w-lg              │
│                                                                 │
│     [Commencer →]  [Decouvrir]   ← primary + outline CTA       │
│                                                                 │
│           │                      ← scroll indicator (gradient)  │
│                                                                 │
│  ·  ·  ·  ·  ·  ·  ·  ·  ·     ← dot-grid background          │
├─────────────────────────────────────────────────────────────────┤
│                         ── hr ──                                │
├─────────────────────────────────────────────────────────────────┤
│  LE CONSTAT                      PROBLEM SECTION                │
│                                                                 │
│  ┌─── col-span-2 ───┐  ┌────────── col-span-3 ──────────┐     │
│  │ Label mono        │  │ Paragraphe 1                    │     │
│  │ Titre display     │  │ Paragraphe 2 (avec <strong>)    │     │
│  │                   │  │ Paragraphe 3                    │     │
│  └───────────────────┘  └────────────────────────────────┘     │
│                  grid lg:grid-cols-5                             │
├─────────────────────────────────────────────────────────────────┤
│                         ── hr ──                                │
├─────────────────────────────────────────────────────────────────┤
│  FONCTIONNALITES                 FEATURES SECTION               │
│                                                                 │
│  Label mono + Titre display                                     │
│                                                                 │
│  ┌──────────┬──────────┬──────────┐                             │
│  │ 01       │ 02       │ 03       │                             │
│  │ [icon]   │ [icon]   │ [icon]   │  ← grid gap-px avec        │
│  │ Titre    │ Titre    │ Titre    │    bg-stone-200 = bordures  │
│  │ Desc     │ Desc     │ Desc     │    1px entre les cells      │
│  ├──────────┼──────────┼──────────┤                             │
│  │ 04       │ 05       │ 06       │                             │
│  │ [icon]   │ [icon]   │ [icon]   │                             │
│  │ Titre    │ Titre    │ Titre    │                             │
│  │ Desc     │ Desc     │ Desc     │                             │
│  └──────────┴──────────┴──────────┘                             │
│       sm:grid-cols-2  lg:grid-cols-3                            │
├─────────────────────────────────────────────────────────────────┤
│                         ── hr ──                                │
├─────────────────────────────────────────────────────────────────┤
│  ARCHITECTURE                    HOW IT WORKS                   │
│                                                                 │
│  Label mono + Titre display                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────┐                │
│  │         ┌─────────────────┐                 │                │
│  │         │  PWA Next.js    │  ← border-2     │                │
│  │         └────────┬────────┘                 │                │
│  │                  │ HTTP + JWT               │                │
│  │                  ▼                          │                │
│  │         ┌─────────────────┐                 │                │
│  │         │ Proxy Hono/Bun  │  ← border-2     │                │
│  │         └────────┬────────┘    plus fonce   │                │
│  │                  │ fetch + cookies          │                │
│  │                  ▼                          │                │
│  │         ┌ ─ ─ ─ ─ ─ ─ ─ ┐                 │                │
│  │         │   API SNCF     │  ← dashed       │                │
│  │         └ ─ ─ ─ ─ ─ ─ ─ ┘                 │                │
│  │                                             │                │
│  │  ── connexion directe   - - service tiers   │                │
│  └─────────────────────────────────────────────┘                │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Session  │  │ Zero     │  │ PWA      │  ← 3 cards           │
│  │ securisee│  │ latence  │  │ offline  │    techniques         │
│  └──────────┘  └──────────┘  └──────────┘                      │
├─────────────────────────────────────────────────────────────────┤
│                         ── hr ──                                │
├─────────────────────────────────────────────────────────────────┤
│  VIE PRIVEE                      PRIVACY SECTION               │
│                                                                 │
│  ┌────── col 1 ──────┐  ┌──────── col 2 ────────┐             │
│  │ Label + Titre      │  │ [lock] Auto-heberge   │             │
│  │ Paragraphe         │  │ [lock] Pas de tracking │             │
│  │                    │  │ [lock] Open source     │             │
│  │                    │  │ [lock] Usage personnel │             │
│  └────────────────────┘  └───────────────────────┘             │
│             grid lg:grid-cols-2                                 │
├─────────────────────────────────────────────────────────────────┤
│                         CTA FINAL                               │
│                                                                 │
│     Pret a embarquer ?           ← display, bold               │
│     Tagline                      ← body, muted                 │
│     [Se connecter →]             ← primary CTA                 │
│                                                                 │
│  ·  ·  ·  ·  ·  ·  ·  ·  ·     ← dot-grid bg-stone-100       │
├─────────────────────────────────────────────────────────────────┤
│  🚂 MAX SNCF     Projet personnel · Non affilie a la SNCF      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Patterns visuels distinctifs

### 1. Dot-grid background (hero + CTA)

```css
background-image: radial-gradient(circle, #a8a29e 1px, transparent 1px);
background-size: 28px 28px;
```

Evoque le papier technique / papier ingenieur. Applique en overlay `opacity-40`
(light) ou `opacity-20` (dark). Purement decoratif (`pointer-events: none`).

### 2. Gap-px grid (features)

```html
<div class="grid gap-px bg-stone-200 dark:bg-stone-800">
  <div class="bg-stone-50 dark:bg-stone-950 p-8">...</div>
  <!-- Les 1px de gap laissent apparaitre le bg parent = bordures fines -->
</div>
```

Cree un effet de grille avec bordures 1px parfaitement uniformes, plus propre
qu'un `border` sur chaque cellule (pas de doublements aux jonctions).

### 3. Ordinals monoespace

```html
<span class="font-mono text-xs font-bold text-stone-300">01</span>
```

Chaque feature card affiche son numero d'ordre en haut a droite. Discret
(stone-300) mais structure visuellement la grille.

### 4. Flow diagram (architecture)

Boites empilees verticalement reliees par des lignes `w-[1px] bg-stone-300`,
des labels `font-mono text-[10px]` dans des badges `bg-stone-100`, et des
triangles CSS pour les fleches. La boite "API SNCF" est en `border-dashed`
pour indiquer un service tiers non controle.

### 5. Scroll indicator (hero)

```html
<div class="h-10 w-[1px] bg-gradient-to-b from-stone-400 to-transparent" />
```

Fine ligne verticale en bas du hero qui s'estompe vers le bas.

---

## Animations

### Scroll-reveal (`Reveal` component)

Chaque section entre avec un fade-up via IntersectionObserver :

```
opacity: 0 → 1
transform: translateY(24px) → translateY(0)
transition: 0.7s cubic-bezier(0.22, 1, 0.36, 1)
```

- **threshold**: 0.15 (declenche quand 15% du bloc est visible)
- **rootMargin**: `0px 0px -40px 0px` (evite le declenchement au ras du viewport)
- **delay**: echelonne par props `delay` (100ms, 150ms, etc.) pour un effet stagger
- **once**: l'observer se desinscrit apres le premier reveal

### Reduced motion

```ts
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  el.style.opacity = "1";
  el.style.transform = "none";
  return; // pas d'animation
}
```

### Micro-interactions (CTAs)

- `active:scale-[0.98]` — leger press-down au tap
- `group-hover:translate-x-0.5` — la fleche avance au hover

---

## Responsive

### Breakpoints utilises

| Breakpoint | Adaptation                                           |
|------------|------------------------------------------------------|
| < 640px    | Single column, full-width sections, stacked CTAs     |
| sm (640+)  | Feature grid 2 cols, CTAs en row, flow diagram wider |
| lg (1024+) | Problem 2+3 cols, features 3 cols, privacy 2 cols   |

### Regles appliquees

- `min-h-dvh` (jamais `100vh`)
- `clamp()` pour toute la typographie
- `max-w-5xl` (1280px) pour le contenu, `max-w-3xl` (768px) pour le hero/CTA
- `px-6` global (24px, superieur aux safe-area-inset classiques)
- `pb-[max(1.5rem,env(safe-area-inset-bottom))]` sur le footer
- Touch targets `min-h-[48px]` sur tous les CTAs
- Pas de hover-only interactions (hover est un bonus visuel)

---

## Fichiers concernes

| Fichier | Role |
|---------|------|
| `apps/web/src/app/page.tsx` | Composant React de la landing (client component) |
| `apps/web/src/app/globals.css` | Palette stone (brand tokens + HSL variables + surface-rail) |
| `apps/web/src/app/layout.tsx` | Fonts (Bricolage, Hanken, JetBrains), themeColor stone |
