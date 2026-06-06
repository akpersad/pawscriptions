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
- **Shared Supabase project → dedicated schema.** This project's DB may be shared with
  another app that lives in `public`. ALL Pawscriptions tables live in their own
  `pawscriptions` schema, and the client in `src/lib/supabase.ts` is pinned to it
  (`db: { schema: "pawscriptions" }`), so `.from("...")` calls can never touch `public`.
  Keep new tables in `pawscriptions` (see `supabase/schema.sql`); never query `public`.
- **RLS is on with no policies** — security comes from (a) the DB only being reachable
  server-side and (b) the passphrase gate in `src/proxy.ts`. Don't loosen this.
- **Auth = one shared passphrase** (`APP_PASSWORD`) → signed cookie (`src/lib/auth.ts`).
  Public paths are allowlisted in `proxy.ts`; everything else needs the cookie. The cron
  route guards itself with `CRON_SECRET` instead.
- **All dose-time math goes through `src/lib/schedule.ts`** using luxon + `APP_TIMEZONE`.
  Vercel runs in UTC — never compare times in server-local time.
- **Reminders** are sent by `app/api/cron/reminders/route.ts`, triggered by an external
  per-minute cron (cron-job.org). A slot's reminder fires at dose time minus the med's
  `reminder_lead_minutes` (`reminderFireTime` in `schedule.ts`). `notifications_sent`
  dedupes per med+slot; insert-then-send so the unique constraint prevents double buzzes
  across concurrent runs. Slots that fire together (same dose time) are grouped into one
  push whose copy scales (1 = med + dose; 2 = "Dog: A and B"; 3+ = "Dog has N meds due");
  the dog's name comes from `APP_DOG_NAME` (defaults to `Bodhi`).
- **Label scanning** (`components/ScanLabel.tsx`) OCRs a med label client-side via
  `tesseract.js` (lazy-loaded) and `lib/parseLabel.ts` (pure heuristics) to prefill the
  medication form. The photo is never uploaded or stored — it stays in browser memory.

## Data model
`medications` (type: fixed | variable | as_needed) → `schedules` (times + days) →
`dose_logs` (the audit trail). `daily_dose_plan` holds per-day amounts for variable meds.
`push_subscriptions` + `notifications_sent` power reminders. Full DDL: `supabase/schema.sql`.

Notable `medications` columns beyond the basics:
- `strength` — optional descriptive label (e.g. "25 mg"), separate from `unit`/`default_dose`.
- `reminder_lead_minutes` — how many minutes before dose time to fire the push (0 = at time).
- `is_one_off` — set on ad-hoc meds auto-created from a one-off dose on Today; these are
  hidden from the medications list, the as-needed section, and pickers (but kept for history
  name resolution). Filter via `getMedicationsWithSchedules({ includeOneOff: false })`.

`dose_logs.given_at` is the real time a dose was given (user-editable, interpreted in
`APP_TIMEZONE`), distinct from `created_at`. Dose actions in `lib/actions.ts`: `logDose`,
`editDose`, `logAdHocDose`, `undoDose`.

## Conventions
- TypeScript, Tailwind v4 (`.input` utility in `globals.css`), npm.
- Server Actions live in `*/actions.ts` or `src/lib/actions.ts` (`"use server"`), call
  `revalidatePath` after writes.
- Data pages export `const dynamic = "force-dynamic"` (they read live data; no prerender).
- Verify changes with `npm run build` (type-checks) and the smoke tests in HANDOFF.md.
