# Pawscriptions — Handoff

_Status as of 2026-06-06. Initial build complete; runs and builds cleanly. A refinement
round on branch `feature/refinement` added 8 features + a mobile fix (see below)._

## Refinement round (branch `feature/refinement`)

Builds and lints clean (`npm run build`, `npm run lint`). One commit per item:

1. **History date inputs** no longer overlap on iOS Safari (WebKit gives date inputs a large
   intrinsic min-width; reset `-webkit-appearance` + `min-width` in `globals.css`).
2. **Editable "time given"** on the dose sheet — logs the real time, interpreted in `APP_TIMEZONE`.
3. **Edit a given dose** by tapping it on Today (`editDose` action).
4. **Optional strength** (`medications.strength`, e.g. "25 mg") shown across the app.
5. **Ad-hoc one-off doses** on Today — known med or free-typed (auto-creates a hidden
   `is_one_off` as-needed med); off-schedule doses show in an "Extra today" section.
6. **Who-gave dropdown** — Andrew / Cindy / Other (`GiverField`), replacing free text.
7. **Per-med history page** at `/history/[medId]` — running log + 7/30-day/all-time counts.
8. **Per-med reminder lead time** (`reminder_lead_minutes`) + grouped dynamic push copy
   for meds due together; dog name via `APP_DOG_NAME` (defaults to `Bodhi`).
9. **Label scanning** — client-side Tesseract.js OCR (`tesseract.js` dep) + `lib/parseLabel.ts`
   prefill the med form; the photo is never uploaded or stored.

**Schema:** three additive columns on `pawscriptions.medications` (`strength`, `is_one_off`,
`reminder_lead_minutes`), applied to the live shared project via the MCP (only `pawscriptions`
touched) and mirrored in `supabase/schema.sql`. No new tables. **New dep:** `tesseract.js`.
**New optional env var:** `APP_DOG_NAME`. Deferred ideas live in `FUTURE_FEATURES.md`.

## Where things stand

The full app is implemented and the production build passes (`npm run build` — types OK,
all routes compiled). It runs locally; auth gate, login, manifest, service worker, and the
cron auth guard are smoke-tested and working.

Supabase is now fully wired up and verified (details under "Resolved" below). **The
remaining work to go live is configuration**, not code:
1. ✅ **Done** — `supabase/schema.sql` run on the shared project; the dedicated
   `pawscriptions` schema + all 6 tables exist, the schema is exposed, and REST
   reachability is verified.
2. ✅ **Done (locally)** — the real `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are in
   `.env.local`, so data pages load against the live project. Still need to add these
   (and every other env var) to Vercel — see step 3.
3. Deploy to Vercel; add all env vars there (README §4).
4. Set up the cron-job.org job (README §5).
5. Add to Home Screen on both iPhones and enable reminders (README §6).

## ✅ Resolved (2026-06-06, branch `shared-supabase-isolation`)

This branch moved all tables into a dedicated `pawscriptions` schema so the app can't
interfere with another app sharing the same Supabase project. The two former blocking
config issues are now done:

1. **Schema created + exposed (was blocking).** `supabase/schema.sql` was run via the
   Supabase MCP — the `pawscriptions` schema + all 6 tables now exist, RLS on, granted to
   `service_role` only. The schema was exposed by setting
   `pgrst.db_schemas = 'public, graphql_public, pawscriptions'` on the `authenticator`
   role, then `NOTIFY pgrst, 'reload config'` **and** `NOTIFY pgrst, 'reload schema'`
   (both needed — config exposes the schema, schema-cache reload discovers the tables).
   Verified reachable: `GET /rest/v1/medications` with `Accept-Profile: pawscriptions`
   and the service-role key returns `200 []`. Additive — `public`/`graphql_public` (the
   other app) untouched.
   ⚠️ **Caveat:** the expose was set at the **role level**, not via the dashboard, so
   **Settings → API → Exposed schemas may still display only `public, graphql_public`**.
   If anyone edits/saves that dashboard field it will overwrite the role setting and drop
   `pawscriptions` — re-add it there (or re-run the `ALTER ROLE` + both `NOTIFY`s) if a
   data page starts 500ing with `PGRST106`.
2. **MCP connection.** `.mcp.json` now points at the **hosted** Supabase MCP server
   (`https://mcp.supabase.com/mcp?project_ref=…`, **read-write**, no `--read-only`),
   authenticated via **OAuth** (`/mcp` in Claude Code) — *not* a `SUPABASE_ACCESS_TOKEN`
   env var, so the old "export a PAT" step is obsolete. The DB fixes above were applied
   through it. ⚠️ This change to `.mcp.json` is **uncommitted**; commit it if you want it
   to be the standing config. Because it can write project-wide on a **shared** project,
   the guardrail is procedural: only ever touch the `pawscriptions` schema, never `public`.

Already fixed this session: `APP_TIMEZONE` typo (`America/New York` → `America/New_York`),
and removed stray `NEXT_PUBLIC_SUPABASE_*` keys from `.env.local` (they'd have shipped a
Supabase key to the browser; the app never uses them).

## What's done

- ✅ Next.js 16 + TS + Tailwind v4 scaffold; PWA manifest + icons + `public/sw.js`.
- ✅ Passphrase auth: `src/proxy.ts` guard + `src/lib/auth.ts` (jose) + `/login`.
- ✅ Supabase schema (`supabase/schema.sql`), server-only client, data layer (`lib/data.ts`).
- ✅ Medications CRUD (`/medications`, `/new`, `/[id]`) with the 3 types + schedule editor,
  optional strength, per-med reminder lead time, and client-side label scanning.
- ✅ Today dashboard: due / given / as-needed, give-with-attribution (editable time +
  Andrew/Cindy/Other), tap-to-edit a given dose, one-off / off-schedule doses, undo.
- ✅ History/audit with med + date filters, plus a per-med detail page (`/history/[medId]`)
  with a running log and dose counts.
- ✅ Settings: enable/disable push per device, send test, log out.
- ✅ Reminder pipeline: subscribe API, `web-push` sender, cron route with tz-aware
  lead-time fire logic, `notifications_sent` dedupe, and grouped dynamic copy.
- ✅ Docs: README (setup/deploy), CLAUDE.md (AI guidance), FUTURE_FEATURES.md, this file.

## Smoke tests (local)

```bash
npm run dev
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/                       # 307 -> /login
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/login                  # 200
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/manifest.webmanifest   # 200
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/cron/reminders     # 401 (no secret)
```

## End-to-end test once Supabase is connected

1. Log in with `APP_PASSWORD`.
2. Add a **fixed** med with a time set to ~1 minute from now → it shows under "Due today".
3. Tap **Give**, set dose + name → it moves to "Given"; check `/history`.
4. Add a **variable** med (no daily plan) → Today prompts "set today's dose"; the Give form
   lets you enter the actual amount.
5. Add an **as-needed** med → "Give now" logs without a schedule and shows a count.
6. Tap a **given** dose on Today → the sheet reopens prefilled; change the time/amount/giver
   and save (`editDose`).
7. **Log a one-off dose** → either pick a known med or type a new name; it lands in "Extra
   today" and in History, but the new one-off med stays out of the medications list.
8. On **History**, tap a med name → its detail page shows the running log + 7/30-day/all-time
   counts.
9. On the **new-med form**, tap **Scan label**, photograph a printed label → fields prefill
   for review (name may need fixing; that's expected).
10. After deploy + Home Screen install: Settings → Enable reminders → Send test.
11. Set a med's **Remind me** to "15 minutes before" and trigger the cron manually:
    `curl "https://<project>.vercel.app/api/cron/reminders?secret=$CRON_SECRET"`
    → expect a push ~15 min before the dose time, one combined push if several are due
    together, and `{"sent":0}` on the next call (deduped).

## Possible next steps (not built)

See **`FUTURE_FEATURES.md`** for the scoped backlog — supply/refill tracking (top priority),
skip-with-reason, overdue escalation nudge, vet-export, weight log. Other ideas:

- As-needed **minimum-interval** warning (e.g. "no more than every 8h").
- A dedicated **daily-dose-plan editor** for variable meds (currently set implicitly when
  logging; `setDailyPlan` action exists and is wired but has no standalone UI yet).
- **Multi-pet** support (intentionally deferred — current model is single-dog).

## Gotchas / notes

- `.env.local` holds pre-generated `SESSION_SECRET`, `CRON_SECRET`, and VAPID keys. For
  production, consider regenerating and storing only in Vercel.
- VAPID keys must match between `VAPID_PUBLIC_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- Web Push needs HTTPS — won't work over plain `localhost`; test push on the Vercel URL.
- Supabase free tier pauses after ~1 week idle; daily use avoids it.
- There's a stray `package-lock.json` in the parent `PersonalProjects/` dir; `next.config.ts`
  pins `turbopack.root` to this project so it's ignored.
