# Design / UI / UX Agent Skills

A portable catalog of the **design, UI, and UX skills** installed in this project, so you can
reinstall and use them in another project with a different agent. Each entry covers **what it
does**, **how to install it**, and **how to best use it**.

> These are [open agent skills](https://skills.sh/) — modular packages that extend an AI coding
> agent (Claude Code, etc.) with specialized knowledge and workflows. They live in
> `.claude/skills/<name>/SKILL.md` and are invoked by typing `/<skill-name>` or by the agent
> auto-selecting one when the task matches its description.

---

## TL;DR — install everything

All but one of these are managed by the **Skills CLI** (`npx skills`). From the root of the target
project:

```bash
# UI/UX intelligence + the "ckm" design suite (one repo, six skills)
npx skills add nextlevelbuilder/ui-ux-pro-max-skill

# Standalone design skills
npx skills add ryanthedev/design-for-ai
npx skills add Leonxlnx/taste-skill        # installs as "design-taste-frontend"
npx skills add emilkowalski/skill          # installs as "emil-design-eng"

# Impeccable manages itself via its own CLI (not the Skills CLI)
npx impeccable@latest                      # bootstraps the skill into .claude/skills/impeccable
```

Useful Skills-CLI housekeeping:

```bash
npx skills find <query>   # search the ecosystem
npx skills check          # check for updates
npx skills update         # update all installed skills
```

A `skills-lock.json` is written at the project root pinning each skill's source + content hash.
Commit it (or copy it over) to make installs reproducible. **Note:** by default skills install
into `.claude/skills/`, which is commonly git-ignored — decide per project whether to track them.

---

## The skills

### 1. `ui-ux-pro-max` — UI/UX design intelligence
**Source:** `nextlevelbuilder/ui-ux-pro-max-skill` (GitHub)
**Install:** `npx skills add nextlevelbuilder/ui-ux-pro-max-skill`

**What it does:** A reference brain for building UI across web and mobile. Ships 50+ styles,
161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, and 25 chart types,
spanning 10 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind,
shadcn/ui, plain HTML/CSS). Optionally integrates the shadcn/ui MCP for component search.

**Best used for:** planning or building a screen from scratch when you want curated, opinionated
choices instead of generic defaults — "design a SaaS dashboard," "pick a font pairing + palette
for a fintech landing page," "review this component for UX issues."

**How to use it well:**
- Give it the **product type + stack + style** up front ("Next.js + Tailwind, bento-grid SaaS
  dashboard, dark mode") so it pulls the right palette/font/guideline set.
- Great as the *first* step — let it pick the palette/typography system, then hand off to
  `impeccable` or `emil-design-eng` for the build + polish.

---

### 2. The `ckm:*` design suite (ClaudeKit)
**Source:** `nextlevelbuilder/ui-ux-pro-max-skill` (GitHub — same repo as above; one
`npx skills add` installs all of them)

Six related skills authored by "claudekit":

| Skill | What it does |
|---|---|
| `ckm:design` | Umbrella design skill: brand identity, design tokens, **logo generation (55 styles, Gemini AI)**, corporate identity programs (50 deliverables + mockups), HTML presentations (Chart.js), banner & icon design, multi-platform social photos. |
| `ckm:design-system` | Three-layer token architecture (primitive → semantic → component), CSS variables, spacing/type scales, component specs. The systematic-foundations skill. |
| `ckm:ui-styling` | Build accessible UIs with **shadcn/ui** (Radix + Tailwind): dialogs, dropdowns, forms, tables, theming, dark mode, canvas visuals. |
| `ckm:brand` | Brand voice, messaging frameworks, asset management, style guides, brand-consistency review. |
| `ckm:banner-design` | Banners for social/ads/web-hero/print with AI-generated visuals; 14+ art directions, platform-sized. |
| `ckm:slides` | Strategic HTML presentations with Chart.js, design tokens, responsive layouts, copywriting formulas. |

**How to use them well:**
- Start at the **system** level (`ckm:design-system`) to lay down tokens, then `ckm:ui-styling`
  to build components against those tokens — keeps everything consistent.
- The logo / banner / social-photo generators in `ckm:design` use **Gemini AI** and screenshot
  pipelines — they may need API keys / headless-browser tooling configured. Check the skill's
  `scripts/` and `references/` before first run.
- `ckm:brand` pairs naturally before `ckm:slides`/`ckm:banner-design` so generated assets inherit
  a defined voice + visual identity.

---

### 3. `impeccable` — production-grade frontend craft
**Source:** self-managed npm CLI (`npx impeccable`) — **not** the Skills CLI
**Install:** `npx impeccable@latest` (bootstraps into `.claude/skills/impeccable`)
**Update:** `npx impeccable skills update`

**What it does:** The heavyweight build-and-polish skill. Designs, redesigns, audits, critiques,
and polishes real production interfaces — websites, landing pages, dashboards, app shells,
components, forms, onboarding, empty states. Covers visual hierarchy, IA, cognitive load,
accessibility, responsive behavior, theming, typography, color, motion/micro-interactions, UX
copy, error/edge states, i18n, and reusable token systems. Has sub-commands (`craft`, `shape`,
`audit`, `critique`, `polish`, `animate`, `bolder`, `quieter`, `typeset`, `live`, `init`, …) and
can iterate **live in a browser** with screenshots.

**How to use it well:**
- Invoke with a **sub-command + target**: `/impeccable audit src/app/page.tsx`,
  `/impeccable polish the dashboard`, `/impeccable bolder the hero`.
- On a **new project** it expects a `PRODUCT.md` (and optionally `DESIGN.md`). Run
  `/impeccable init` first if you don't have one — it drives every later command.
- It runs `scripts/context.mjs` once per session to load product/design context and check for
  updates; let it. It respects existing design tokens — it preserves committed brand colors
  rather than reinventing them.
- This is the skill to reach for when you want **ship-ready** output, not a prototype.

---

### 4. `emil-design-eng` — UI polish philosophy (Emil Kowalski)
**Source:** `emilkowalski/skill` (GitHub)
**Install:** `npx skills add emilkowalski/skill`

**What it does:** Encodes Emil Kowalski's philosophy on UI polish, component design, animation
decisions, and the invisible details that make software feel great. Less a generator, more a
**taste + craft lens** for refining interactions and components.

**How to use it well:**
- Apply it during **polish/review passes**, especially on **animations, transitions, and
  component micro-details** — "make this dropdown feel right," "should this animate?"
- Complements `impeccable`: use impeccable to build, this to sanity-check that the motion and
  small details feel intentional.

---

### 5. `design-taste-frontend` — anti-slop frontend
**Source:** `Leonxlnx/taste-skill` (GitHub) — installs under the name `design-taste-frontend`
**Install:** `npx skills add Leonxlnx/taste-skill`

**What it does:** "Anti-slop" skill for landing pages, portfolios, and redesigns. Reads the brief,
infers the right design direction, and ships interfaces that **don't look templated**. Uses real
design systems where applicable, is audit-first on redesigns, and runs a strict pre-flight check
before producing output.

**How to use it well:**
- Reach for it on **greenfield landing pages / portfolios** or **redesigns** where the explicit
  goal is to *not* look like a generic AI template.
- Give it a real brief (audience, vibe, references). It performs better the more direction it has,
  since it infers the design direction from the brief.

---

### 6. `design-for-ai` — visual design principles
**Source:** `ryanthedev/design-for-ai` (GitHub)
**Install:** `npx skills add ryanthedev/design-for-ai`

**What it does:** Applies foundational visual-design principles (based on *Design for Hackers* by
David Kadavy) when building or reviewing UI: choosing fonts/colors/proportions, establishing
visual hierarchy, building color palettes and type scales, motion/interaction, and responsive
decisions.

**How to use it well:**
- Use it as a **review/teaching lens** when you want the *reasoning* behind choices (why this
  ratio, why this palette) rather than a fast generated result.
- Pairs well with `ui-ux-pro-max`: pro-max gives curated options, `design-for-ai` explains and
  validates the principles behind them.

---

## How they fit together

A practical pipeline for a new project:

1. **Foundations** → `ckm:design-system` (tokens) + `ui-ux-pro-max` (palette, fonts, style).
2. **Brand** (if marketing/landing) → `ckm:brand`, then `design-taste-frontend` for direction.
3. **Build** → `impeccable` (or `ckm:ui-styling` for shadcn-based component work).
4. **Polish & review** → `emil-design-eng` (motion/details) + `design-for-ai` (principles) +
   `impeccable audit/critique`.
5. **Assets** → `ckm:design` (logo/icons/social), `ckm:banner-design`, `ckm:slides`.

**Tips for a clean handoff to the new project:**
- Copy the install commands in the **TL;DR** above, or copy this project's `skills-lock.json`
  and run `npx skills add` per entry, then `npx skills check`.
- Skills auto-trigger from their `description`, but you can always force one with `/<skill-name>`.
- Some `ckm:*` generators need external tooling (Gemini API key, headless browser for
  screenshot→image). Verify those before relying on logo/banner/social-photo generation.
- After installing, list what's available to the agent (in Claude Code, ask "what skills do you
  have") to confirm everything registered.
