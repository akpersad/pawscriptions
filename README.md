# 🐾 Pawscriptions

A lightweight, free PWA for tracking a dog's medications — define what he's on, when
each dose is due, log that it's been given, get push reminders, and audit the history.
Built for a two-person household (no individual accounts; one shared passphrase).

- **Framework:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4
- **Data:** Supabase Postgres (free tier), accessed server-side only via the service-role key
- **Auth:** single shared passphrase → signed cookie → `proxy.ts` route guard
- **Reminders:** external cron → protected API route → Web Push (VAPID)
- **Hosting:** Vercel (Hobby)

---

## 1. Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev
```

Open http://localhost:3000 and log in with your `APP_PASSWORD`.

> `.env.local` is gitignored and already contains generated `SESSION_SECRET`,
> `CRON_SECRET`, and a VAPID key pair. You only need to add the Supabase values and
> pick an `APP_PASSWORD`. Push notifications require HTTPS, so they work on the deployed
> Vercel site (and an iPhone added to the Home Screen), not over plain `localhost`.

## 2. Supabase

You can use a brand-new project or **share an existing one** with another app. Pawscriptions
keeps all of its tables in a dedicated **`pawscriptions` Postgres schema** (never `public`),
and the server client is pinned to that schema — so it can't read, write, or collide with
anything the other app keeps in `public`. The setup is the same either way:

1. Create a free project at supabase.com (or open the one you're sharing).
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   It only **creates** the `pawscriptions` schema and its tables — it never touches `public`.
3. **Project Settings → API → "Exposed schemas"** → add `pawscriptions` next to `public`,
   then **Save** (this reloads the API so the tables become reachable). Required.
   - _Automated/SQL alternative_ (e.g. via the MCP, when you can't use the dashboard):
     `alter role authenticator set pgrst.db_schemas = 'public, graphql_public, pawscriptions';`
     then `notify pgrst, 'reload config';` **and** `notify pgrst, 'reload schema';`. Keep
     `public, graphql_public` in the list so a shared app's API keeps working. Note this
     sets it at the role level, so the dashboard field above may still show only the
     defaults — editing/saving it there would override and drop `pawscriptions`.
4. **Project Settings → API** → copy:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose this)

RLS is enabled on every table with **no policies**, and only the `service_role` is granted
access to the `pawscriptions` schema — so nothing is reachable with the public anon key. All
access goes through the Next.js server using the service-role key, which bypasses RLS. That's
the whole security model: the database is never directly public, and the app itself is gated
by the passphrase.

> **Sharing a project:** the schema script and the running app only ever touch the
> `pawscriptions` schema. Step 3 just *exposes* that schema over the API; it does not change
> the other app's `public` schema or its access in any way.

## 3. Environment variables

| Variable | What it is |
| --- | --- |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project + service-role key (server only) |
| `APP_PASSWORD` | The shared passphrase you and your wife type to unlock the app |
| `SESSION_SECRET` | Signs the session cookie |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push keys (`npx web-push generate-vapid-keys`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Same value as `VAPID_PUBLIC_KEY`, exposed to the browser to subscribe |
| `CRON_SECRET` | Shared secret the reminder cron must pass |
| `APP_TIMEZONE` | IANA tz all dose times are interpreted in (e.g. `America/Toronto`) |

## 4. Deploy to Vercel

1. Push this repo to GitHub, import it in Vercel.
2. Add **all** the env vars above in the Vercel project settings (Production + Preview).
3. Deploy. Your app is at `https://<project>.vercel.app`.

## 5. Reminders (the cron piece)

Vercel Hobby cron is too coarse for medication times, so reminders are driven by a free
external scheduler hitting a protected endpoint.

1. Sign up at **cron-job.org** (free).
2. Create a job that runs **every minute** (or every 5 min) and requests:
   ```
   https://<project>.vercel.app/api/cron/reminders?secret=YOUR_CRON_SECRET
   ```
3. That endpoint figures out which scheduled doses are due *now* (in `APP_TIMEZONE`),
   skips any already given or already notified, and sends a Web Push to every subscribed
   device. The `notifications_sent` table prevents duplicate buzzes.

## 6. Enable notifications on each iPhone

iOS only allows web push for **installed** PWAs on **iOS 16.4+**:

1. Open the deployed site in Safari.
2. Share button → **Add to Home Screen**.
3. Open Pawscriptions from the new home-screen icon.
4. **Settings → Enable reminders**, allow the permission, then **Send test** to confirm.

Repeat on both phones — each device gets its own push subscription.

## 7. Supabase MCP (optional, for AI tooling)

The repo ships a project-scoped Supabase MCP server in [`.mcp.json`](.mcp.json) so AI
assistants (e.g. Claude Code) can inspect and manage the database. It points at Supabase's
**hosted** MCP endpoint (`https://mcp.supabase.com/mcp?project_ref=…`), scoped to this
project's ref. To use it:

1. Run `/mcp` in Claude Code (or your MCP client's equivalent) and complete the **OAuth**
   sign-in to Supabase. No `SUPABASE_ACCESS_TOKEN` / personal access token is needed —
   auth is interactive, not an env var.
2. That's it — the connection persists for the session.

`.mcp.json` contains **no secrets** (only the non-sensitive project ref) and is committed.

> ⚠️ **This server is read-write** (there is no `--read-only` flag), and the project is
> **shared** with another app whose data lives in `public`. The hosted MCP grants
> project-wide write/DDL — it is *not* confined to the `pawscriptions` schema. The
> safeguard is procedural: only ever run statements against the `pawscriptions` schema;
> never `DROP`/`ALTER`/`INSERT`/`UPDATE`/`DELETE` against `public`. For a stricter setup,
> switch back to the stdio server with `--read-only` (it requires a `SUPABASE_ACCESS_TOKEN`
> env var instead of OAuth).

---

## Medication types

- **Fixed** — same dose at set times every (selected) day.
- **Variable** — same times, but today's amount can change. Set it via the daily plan, or
  just type the actual amount when you log the dose.
- **As needed** — no schedule; a “Give now” button logs it whenever you give it.

## Project layout

```
src/
  proxy.ts                 # passphrase route guard (Next 16's renamed middleware)
  lib/
    auth.ts                # session cookie signing/verify (jose)
    supabase.ts            # server-only service-role client
    data.ts                # all DB reads
    actions.ts             # server actions (med CRUD, dose logging)
    schedule.ts            # timezone-aware "what's due" computation (luxon)
    push.ts                # Web Push sender (web-push)
    types.ts, env.ts
  app/
    page.tsx               # Today
    medications/           # list + new + [id] edit
    history/               # audit
    settings/              # push controls + logout
    login/                 # passphrase gate
    api/cron/reminders/    # scheduled reminder sender (CRON_SECRET)
    api/push/subscribe/    # save/remove a device subscription
    api/push/test/         # send a test push
    manifest.ts
public/sw.js               # service worker (install + push handling)
supabase/schema.sql        # database schema
```

See [HANDOFF.md](HANDOFF.md) for current status and next steps.
