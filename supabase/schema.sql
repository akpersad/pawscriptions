-- Pawscriptions schema.
-- Run this in the Supabase dashboard → SQL Editor (or `supabase db push`).
--
-- ⚠️ SHARED SUPABASE PROJECT
-- This project's database is shared with another app, which lives in the default
-- `public` schema. To guarantee Pawscriptions can NEVER read, write, or collide
-- with that app's data, ALL Pawscriptions objects live in their own dedicated
-- `pawscriptions` schema. The app's Supabase client is pinned to this schema
-- (see src/lib/supabase.ts), so it cannot even address a `public` table.
--
-- This script only CREATES new objects inside the `pawscriptions` schema and
-- grants on those objects. It never touches `public` or anything the other app owns.
--
-- One-time dashboard step (required): Settings → API → "Exposed schemas" →
-- add `pawscriptions` alongside `public`, then Save (this reloads PostgREST).
--
-- Security model: RLS is ON with no policies, and only `service_role` is granted
-- access to this schema. The anon/authenticated roles get nothing here, so the
-- schema is unreachable with the public anon key. The service role (used only
-- server-side) bypasses RLS.

create schema if not exists pawscriptions;

create extension if not exists "pgcrypto";

-- Medications the dog is on -----------------------------------------------------
create table if not exists pawscriptions.medications (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  type         text not null check (type in ('fixed', 'variable', 'as_needed')),
  unit         text not null default 'pill',     -- 'pill', 'mg', 'ml', 'tablet'...
  default_dose numeric,                           -- fixed: the dose; variable: fallback
  strength     text,                              -- optional label, e.g. '25 mg' (descriptive)
  instructions text,
  active       boolean not null default true,
  is_one_off   boolean not null default false,    -- ad-hoc med from a one-off dose; hidden from lists/pickers
  reminder_lead_minutes integer not null default 0, -- send the push this many minutes before dose time
  created_at   timestamptz not null default now()
);

-- Times of day a med is due (fixed & variable only) -----------------------------
create table if not exists pawscriptions.schedules (
  id            uuid primary key default gen_random_uuid(),
  medication_id uuid not null references pawscriptions.medications(id) on delete cascade,
  time_of_day   time not null,                    -- e.g. 08:00, 20:00 (in APP_TIMEZONE)
  days_of_week  smallint[],                       -- null = every day; else 0=Sun..6=Sat
  created_at    timestamptz not null default now()
);
create index if not exists schedules_medication_id_idx
  on pawscriptions.schedules(medication_id);

-- The audit trail: every dose actually given ------------------------------------
create table if not exists pawscriptions.dose_logs (
  id            uuid primary key default gen_random_uuid(),
  medication_id uuid not null references pawscriptions.medications(id) on delete cascade,
  scheduled_for timestamptz,                       -- which slot this satisfies (null = as-needed)
  given_at      timestamptz not null default now(),
  dose_amount   numeric,
  unit          text,
  given_by      text,                              -- free attribution; no accounts
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists dose_logs_medication_id_idx
  on pawscriptions.dose_logs(medication_id);
create index if not exists dose_logs_given_at_idx
  on pawscriptions.dose_logs(given_at);
-- A scheduled slot can only be satisfied once:
create unique index if not exists dose_logs_slot_uniq
  on pawscriptions.dose_logs(medication_id, scheduled_for)
  where scheduled_for is not null;

-- Planned dose for variable/tapering meds on a given day ------------------------
create table if not exists pawscriptions.daily_dose_plan (
  id            uuid primary key default gen_random_uuid(),
  medication_id uuid not null references pawscriptions.medications(id) on delete cascade,
  date          date not null,
  planned_dose  numeric not null,
  unique(medication_id, date)
);

-- Web Push subscriptions (one per device) ---------------------------------------
create table if not exists pawscriptions.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  keys       jsonb not null,                       -- { p256dh, auth }
  label      text,
  created_at timestamptz not null default now()
);

-- Dedupe so the per-minute cron doesn't re-send the same reminder ---------------
create table if not exists pawscriptions.notifications_sent (
  id            uuid primary key default gen_random_uuid(),
  medication_id uuid not null references pawscriptions.medications(id) on delete cascade,
  scheduled_for timestamptz not null,
  sent_at       timestamptz not null default now(),
  unique(medication_id, scheduled_for)
);

-- Lock everything down to the service role only. -------------------------------
alter table pawscriptions.medications        enable row level security;
alter table pawscriptions.schedules          enable row level security;
alter table pawscriptions.dose_logs          enable row level security;
alter table pawscriptions.daily_dose_plan    enable row level security;
alter table pawscriptions.push_subscriptions enable row level security;
alter table pawscriptions.notifications_sent enable row level security;

-- Grant access to the service role ONLY (used server-side; bypasses RLS).
-- We deliberately grant nothing to anon/authenticated, so the public anon key
-- cannot reach this schema even though it is exposed via the API.
grant usage on schema pawscriptions to service_role;
grant all privileges on all tables in schema pawscriptions to service_role;
grant all privileges on all sequences in schema pawscriptions to service_role;
-- Apply the same default to anything added to this schema later.
alter default privileges in schema pawscriptions
  grant all privileges on tables to service_role;
alter default privileges in schema pawscriptions
  grant all privileges on sequences to service_role;
