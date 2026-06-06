# Design

Visual system for Pawscriptions. Identity: **tri-color mini Australian Shepherd** —
espresso black, copper/tan, cream white, with the breed's amber eye as a sparing highlight.
Register: **product UI** (warm but functional). Source of truth for tokens is
`src/app/globals.css`; this document explains the intent.

## Theme
Warm, premium pet-care — devoted, dependable, gentle. Calm, never clinical or alarming.
Full **light + dark**, following the OS `prefers-color-scheme`. Warmth is carried by color,
roundness, generous space, and kind copy — never by decoration that slows the one-tap-to-log
task. Deliberately avoids the "cream AI body background" cliché: the body is a barely-warm
off-white (very low chroma), and the warmth lives in the copper accent and espresso ink.

## Color
OKLCH throughout. Semantic tokens flip with the OS theme via CSS variables mapped into
Tailwind utilities (`bg-surface`, `text-ink`, `text-muted`, `bg-accent`, `border-border`, …).
All pairs verified to WCAG AA in both themes.

| Token | Role | Light | Dark |
|---|---|---|---|
| `bg` | page | warm off-white `oklch(.985 .006 70)` | espresso `oklch(.205 .014 62)` |
| `surface` | cards / rows | white | `oklch(.246 .016 62)` |
| `surface-2` | inputs / panels / nav | `oklch(.966 .008 70)` | `oklch(.285 .017 62)` |
| `border` | hairlines | `oklch(.905 .012 68)` | `oklch(.34 .015 62)` |
| `ink` | primary text | espresso `oklch(.27 .022 55)` | cream `oklch(.95 .01 76)` |
| `muted` | secondary text | `oklch(.475 .02 58)` | `oklch(.74 .014 70)` |
| `accent` | copper — primary action, active, "given" | `oklch(.535 .115 50)` | `oklch(.72 .115 56)` |
| `amber` | sparing highlight | `oklch(.72 .12 70)` | `oklch(.82 .12 78)` |
| `warning` | "due / overdue" (warm, not red) | `oklch(.55 .115 62)` | `oklch(.8 .12 72)` |
| `success` | positive | `oklch(.52 .1 150)` | `oklch(.74 .12 152)` |
| `danger` | destructive only | `oklch(.535 .16 28)` | `oklch(.7 .16 28)` |

Strategy: **Restrained** (product default). Copper is the single brand accent, used only for
primary actions, current selection, and "given" state — never decoration. Inactive states never
carry full-saturation color. Shadows are soft and tinted toward the warm hue (no harsh black);
in dark mode depth comes from borders + a faint inner highlight.

## Typography
- **Geist Sans** — the single UI family (labels, buttons, body, data). Weight contrast
  400/500/600/700; negative tracking on headings. `font-variant-numeric: tabular-nums` (`.tnum`)
  on all dose amounts, times, and counts so data aligns in columns.
- **Fraunces** (variable soft serif) — brand moments only: the wordmark, the Today greeting,
  empty-state and error titles. Contrast-axis pairing (humanist serif + geometric sans) gives
  editorial warmth without ever entering functional UI.

## Shape, depth, motion
- Squircle radii: rows `1rem`, cards `1.25rem`, sheets `1.75rem`, controls/pills `full`.
- Tactile depth: soft tinted ambient shadows + a 1px inner highlight on raised/glass surfaces.
- **Liquid Glass** (Apple-style) for the floating header and tab bar: translucent material that
  blurs + saturates content beneath it (scroll-edge legibility), concentric radii, inner
  highlight. Degrades to opaque under `prefers-reduced-transparency` or no `backdrop-filter`.
- Motion: 150–280ms, ease-out (`cubic-bezier(.22,1,.36,1)`). Press feedback `scale(.97)` on
  tappables (`.tap`); gentle list fade-up (`.rise`); bottom sheet slides up. No page-load
  choreography. Full `prefers-reduced-motion` fallbacks (transitions collapse to instant).

## Components
- **Dose row** (`.dose-row`) — the core surface affordance: name + tabular meta + a right-side
  primary action or status. Same vocabulary on Today, Meds, and As-needed.
- **Bottom sheet** — the dose logger (dose stepper, "given by", notes); standard mobile pattern,
  not a desktop modal. Backdrop dismiss, Escape, body-scroll lock, focus-friendly.
- **Buttons** — pill-shaped. Primary: copper fill + `accent-ink`. Secondary: bordered surface.
  Tertiary: muted text. Destructive: `danger`, with inline (not `window.confirm`) confirmation.
- **Segmented control** — medication type picker. **Day pills** — schedule day toggles.
- **Progress ring** — Today's answer-at-a-glance ("X / Y doses", or a check when caught up).
- **Empty states** — composed, friendly, teach the first action (never "nothing here").
- **Icons** — a custom 24px stroke set at one 1.75 weight (intentionally not Lucide), plus the
  `<PawMark/>` brand mark.

## Brand mark
A tri-color Aussie paw — cream paw on a copper→espresso gradient squircle tile with a soft amber
glint. Defined once in `src/components/PawMark.tsx`; the PWA icons + favicon (`.ico`, `.svg`,
maskable) are rasterized from the same geometry by `scripts/generate-icons.mjs`.

## Accessibility
WCAG 2.1 AA contrast in both themes. Visible focus rings (copper). Touch targets ≥ 44px. Status
never conveyed by color alone (icon + text). Honors reduced-motion and reduced-transparency.
