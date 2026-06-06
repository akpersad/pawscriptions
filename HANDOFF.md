# Pawscriptions — Handoff

_Status as of 2026-06-06. Initial build complete; runs and builds cleanly._

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
- ✅ Medications CRUD (`/medications`, `/new`, `/[id]`) with the 3 types + schedule editor.
- ✅ Today dashboard: due / given / as-needed, give-with-attribution, undo.
- ✅ History/audit with med + date filters.
- ✅ Settings: enable/disable push per device, send test, log out.
- ✅ Reminder pipeline: subscribe API, `web-push` sender, cron route with tz-aware
  due-now logic and `notifications_sent` dedupe.
- ✅ Docs: README (setup/deploy), CLAUDE.md (AI guidance), this file.

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
6. After deploy + Home Screen install: Settings → Enable reminders → Send test.
7. Trigger the cron manually:
   `curl "https://<project>.vercel.app/api/cron/reminders?secret=$CRON_SECRET"`
   → expect a push when a slot is due, and `{"sent":0}` on the next call (deduped).

## Possible next steps (not built)

- As-needed **minimum-interval** warning (e.g. "no more than every 8h").
- A **follow-up nudge** if a scheduled dose is still ungiven N minutes later.
- A dedicated **daily-dose-plan editor** for variable meds (currently set implicitly when
  logging; `setDailyPlan` action exists and is wired but has no standalone UI yet).
- **Multi-pet** support (intentionally deferred — current model is single-dog).
- Replace emoji nav icons with a proper icon set.

## Gotchas / notes

- `.env.local` holds pre-generated `SESSION_SECRET`, `CRON_SECRET`, and VAPID keys. For
  production, consider regenerating and storing only in Vercel.
- VAPID keys must match between `VAPID_PUBLIC_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- Web Push needs HTTPS — won't work over plain `localhost`; test push on the Vercel URL.
- Supabase free tier pauses after ~1 week idle; daily use avoids it.
- There's a stray `package-lock.json` in the parent `PersonalProjects/` dir; `next.config.ts`
  pins `turbopack.root` to this project so it's ignored.
