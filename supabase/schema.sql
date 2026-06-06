-- Pawscriptions schema.
-- Run this in the Supabase dashboard → SQL Editor (or `supabase db push`).
-- All access is server-side via the service-role key, so we keep RLS ON with no
-- policies = nothing reachable from the public anon key. The service role bypasses RLS.

create extension if not exists "pgcrypto";

-- Medications the dog is on -----------------------------------------------------
create table if not exists medications (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  type         text not null check (type in ('fixed', 'variable', 'as_needed')),
  unit         text not null default 'pill',     -- 'pill', 'mg', 'ml', 'tablet'...
  default_dose numeric,                           -- fixed: the dose; variable: fallback
  instructions text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Times of day a med is due (fixed & variable only) -----------------------------
create table if not exists schedules (
  id            uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id) on delete cascade,
  time_of_day   time not null,                    -- e.g. 08:00, 20:00 (in APP_TIMEZONE)
  days_of_week  smallint[],                       -- null = every day; else 0=Sun..6=Sat
  created_at    timestamptz not null default now()
);
create index if not exists schedules_medication_id_idx on schedules(medication_id);

-- The audit trail: every dose actually given ------------------------------------
create table if not exists dose_logs (
  id            uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id) on delete cascade,
  scheduled_for timestamptz,                       -- which slot this satisfies (null = as-needed)
  given_at      timestamptz not null default now(),
  dose_amount   numeric,
  unit          text,
  given_by      text,                              -- free attribution; no accounts
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists dose_logs_medication_id_idx on dose_logs(medication_id);
create index if not exists dose_logs_given_at_idx on dose_logs(given_at);
-- A scheduled slot can only be satisfied once:
create unique index if not exists dose_logs_slot_uniq
  on dose_logs(medication_id, scheduled_for)
  where scheduled_for is not null;

-- Planned dose for variable/tapering meds on a given day ------------------------
create table if not exists daily_dose_plan (
  id            uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id) on delete cascade,
  date          date not null,
  planned_dose  numeric not null,
  unique(medication_id, date)
);

-- Web Push subscriptions (one per device) ---------------------------------------
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  keys       jsonb not null,                       -- { p256dh, auth }
  label      text,
  created_at timestamptz not null default now()
);

-- Dedupe so the per-minute cron doesn't re-send the same reminder ---------------
create table if not exists notifications_sent (
  id            uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id) on delete cascade,
  scheduled_for timestamptz not null,
  sent_at       timestamptz not null default now(),
  unique(medication_id, scheduled_for)
);

-- Lock everything down to the service role only.
alter table medications        enable row level security;
alter table schedules          enable row level security;
alter table dose_logs          enable row level security;
alter table daily_dose_plan    enable row level security;
alter table push_subscriptions enable row level security;
alter table notifications_sent enable row level security;
