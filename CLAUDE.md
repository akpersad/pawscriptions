# Pawscriptions — guidance for AI assistants

@AGENTS.md

> ⚠️ **This is Next.js 16.** APIs differ from older training data (see AGENTS.md). Before
> writing Next-specific code, check the bundled docs in `node_modules/next/dist/docs/`.
> Key conventions already in use here:
> - `cookies()`/`headers()` are **async** — `await cookies()`.
> - Page `params`/`searchParams` are **Promises** — `await params`.
> - Route handlers use `NextRequest`; `export async function GET/POST`.
> - The route-guard file is **`src/proxy.ts`** exporting `proxy()` (Next 16 renamed
>   `middleware` → `proxy`). Don't re-add `middleware.ts`.

## What this is
A free, single-household PWA to track a dog's medications (define meds + schedules, log
doses, push reminders, audit history). Two users share one dataset — there are **no per-user
accounts**. See README.md for setup/deploy and HANDOFF.md for status.

## Architecture rules (don't break these)
- **No client-side DB access.** Supabase is reached only from the server via the
  service-role key in `src/lib/supabase.ts` (imports `server-only`). Never add
  `NEXT_PUBLIC_SUPABASE_*` or query Supabase from a Client Component.
- **RLS is on with no policies** — security comes from (a) the DB only being reachable
  server-side and (b) the passphrase gate in `src/proxy.ts`. Don't loosen this.
- **Auth = one shared passphrase** (`APP_PASSWORD`) → signed cookie (`src/lib/auth.ts`).
  Public paths are allowlisted in `proxy.ts`; everything else needs the cookie. The cron
  route guards itself with `CRON_SECRET` instead.
- **All dose-time math goes through `src/lib/schedule.ts`** using luxon + `APP_TIMEZONE`.
  Vercel runs in UTC — never compare times in server-local time.
- **Reminders** are sent by `app/api/cron/reminders/route.ts`, triggered by an external
  per-minute cron (cron-job.org). `notifications_sent` dedupes; insert-then-send so the
  unique constraint prevents double buzzes across concurrent runs.

## Data model
`medications` (type: fixed | variable | as_needed) → `schedules` (times + days) →
`dose_logs` (the audit trail). `daily_dose_plan` holds per-day amounts for variable meds.
`push_subscriptions` + `notifications_sent` power reminders. Full DDL: `supabase/schema.sql`.

## Conventions
- TypeScript, Tailwind v4 (`.input` utility in `globals.css`), npm.
- Server Actions live in `*/actions.ts` or `src/lib/actions.ts` (`"use server"`), call
  `revalidatePath` after writes.
- Data pages export `const dynamic = "force-dynamic"` (they read live data; no prerender).
- Verify changes with `npm run build` (type-checks) and the smoke tests in HANDOFF.md.
