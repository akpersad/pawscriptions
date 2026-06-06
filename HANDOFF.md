# Pawscriptions — Handoff

_Status as of 2026-06-06. Initial build complete; runs and builds cleanly._

## Where things stand

The full app is implemented and the production build passes (`npm run build` — types OK,
all routes compiled). It runs locally; auth gate, login, manifest, service worker, and the
cron auth guard are smoke-tested and working.

**The only thing between here and "live" is configuration**, not code:
1. Create the Supabase project and run `supabase/schema.sql`.
2. Put the real `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` into `.env.local` (and Vercel).
3. Deploy to Vercel; add all env vars there.
4. Set up the cron-job.org job (see README §5).
5. Add to Home Screen on both iPhones and enable reminders (README §6).

Until step 2, any data page returns a 500 — verified to be a DNS error on the placeholder
Supabase host (`your-project.supabase.co`), **not a code bug**.

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
