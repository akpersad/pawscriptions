import Link from "next/link";
import { DateTime } from "luxon";
import { AppShell } from "@/components/AppShell";
import { GiveDose } from "@/components/GiveDose";
import { AdHocDose } from "@/components/AdHocDose";
import { UndoDose } from "@/components/UndoDose";
import { CheckIcon, PawIcon, PlusIcon } from "@/components/icons";
import {
  getDailyPlans,
  getDoseLogsForDay,
  getMedicationsWithSchedules,
} from "@/lib/data";
import { buildDoseSlots, nowInAppTz } from "@/lib/schedule";
import { appTimezone } from "@/lib/env";
import type { DoseLog, DoseSlot, Medication } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const today = nowInAppTz();
  const [meds, logs, plans] = await Promise.all([
    getMedicationsWithSchedules({ activeOnly: true }),
    getDoseLogsForDay(today),
    getDailyPlans(today.toISODate()!),
  ]);

  const slots = buildDoseSlots(meds, logs, plans, today);
  // One-off ad-hoc meds are excluded from the regular as-needed section.
  const asNeeded = meds.filter((m) => m.type === "as_needed" && !m.is_one_off);
  const given = slots.filter((s) => s.log);
  const outstanding = slots.filter((s) => !s.log);
  const due = outstanding.filter((s) => DateTime.fromISO(s.scheduledFor) <= today);
  const later = outstanding.filter((s) => DateTime.fromISO(s.scheduledFor) > today);

  // "Extra today": unscheduled doses not represented by the as-needed section —
  // i.e. one-off doses and extra doses of scheduled meds.
  const medById = new Map<string, Medication>(meds.map((m) => [m.id, m]));
  const asNeededIds = new Set(asNeeded.map((m) => m.id));
  const extra = logs
    .filter((l) => l.scheduled_for == null && !asNeededIds.has(l.medication_id))
    .sort((a, b) => b.given_at.localeCompare(a.given_at));
  // Known meds offered in the one-off picker (active, not themselves one-offs).
  const knownMeds = meds
    .filter((m) => !m.is_one_off)
    .map((m) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      strength: m.strength,
      defaultDose: m.default_dose,
    }));

  const hour = today.hour;
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
  const dateLabel = today.toFormat("cccc, LLLL d");

  return (
    <AppShell title="Today">
      {meds.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Hero
            greeting={greeting}
            dateLabel={dateLabel}
            given={given.length}
            total={slots.length}
          />

          {due.length > 0 && (
            <Section title="Due now" tone="due">
              {due.map((s) => (
                <DueRow key={s.scheduleId + s.scheduledFor} slot={s} overdue />
              ))}
            </Section>
          )}

          {later.length > 0 && (
            <Section title="Later today">
              {later.map((s) => (
                <DueRow key={s.scheduleId + s.scheduledFor} slot={s} />
              ))}
            </Section>
          )}

          {given.length > 0 && (
            <Section title="Given">
              {given.map((s) => (
                <GivenRow key={s.scheduleId + s.scheduledFor} slot={s} />
              ))}
            </Section>
          )}
        </>
      )}

      {asNeeded.length > 0 && (
        <Section title="As needed">
          {asNeeded.map((m) => {
            const todays = logs.filter((l) => l.medication_id === m.id);
            const last = [...todays].sort((a, b) => b.given_at.localeCompare(a.given_at))[0];
            return (
              <li key={m.id} className="dose-row">
                <RowBody
                  name={m.name}
                  strength={m.strength}
                  meta={
                    todays.length === 0
                      ? "Not given today"
                      : `Given ${todays.length}× today · last ${time(last.given_at)}`
                  }
                />
                <GiveDose
                  medicationId={m.id}
                  medicationName={m.name}
                  defaultDose={m.default_dose}
                  unit={m.unit}
                  strength={m.strength}
                  label="Give"
                />
              </li>
            );
          })}
        </Section>
      )}

      {extra.length > 0 && (
        <Section title="Extra today">
          {extra.map((log) => (
            <ExtraRow key={log.id} log={log} med={medById.get(log.medication_id)} />
          ))}
        </Section>
      )}

      <div className="mt-2">
        <AdHocDose meds={knownMeds} />
      </div>
    </AppShell>
  );
}

function time(iso: string) {
  return DateTime.fromISO(iso).setZone(appTimezone()).toFormat("h:mm a");
}

/* ---- Hero: greeting + progress ring (the answer at a glance) ------------- */
function Hero({
  greeting,
  dateLabel,
  given,
  total,
}: {
  greeting: string;
  dateLabel: string;
  given: number;
  total: number;
}) {
  const done = total > 0 && given >= total;
  const remaining = total - given;
  let status: string;
  if (total === 0) status = "Nothing scheduled — just any as-needed doses.";
  else if (done) status = "All caught up. Every dose is done.";
  else status = `${remaining} ${remaining === 1 ? "dose" : "doses"} still due today.`;

  return (
    <section
      className="mb-6 flex items-center gap-4 rounded-card bg-surface p-5"
      style={{ boxShadow: "var(--shadow-md), var(--inner-highlight)" }}
    >
      <ProgressRing given={given} total={total} done={done} />
      <div className="min-w-0">
        <p className="font-display text-[1.375rem] leading-tight text-ink">{greeting}</p>
        <p className="mt-0.5 text-[0.8125rem] text-muted">{dateLabel}</p>
        <p className={`mt-2 text-sm font-medium ${done ? "text-accent" : "text-ink"}`}>{status}</p>
      </div>
    </section>
  );
}

function ProgressRing({ given, total, done }: { given: number; total: number; done: boolean }) {
  const pct = total > 0 ? Math.min(100, (given / total) * 100) : 0;
  const r = 15.9155; // circumference ≈ 100, so dasharray reads as a percentage
  return (
    <div className="relative grid size-[5.25rem] shrink-0 place-items-center">
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="3.2" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={`${pct} 100`}
          style={{ transition: "stroke-dasharray 0.6s var(--ease-out-quint)" }}
        />
      </svg>
      <div className="absolute grid place-items-center text-center">
        {done ? (
          <CheckIcon className="size-7 text-accent" />
        ) : total === 0 ? (
          <PawIcon className="size-7 text-faint" />
        ) : (
          <span className="tnum text-[1.0625rem] font-semibold leading-none text-ink">
            {given}<span className="text-muted">/{total}</span>
          </span>
        )}
      </div>
    </div>
  );
}

/* ---- Rows ----------------------------------------------------------------- */
function RowBody({
  name,
  strength,
  meta,
  tone,
}: {
  name: string;
  strength?: string | null;
  meta: React.ReactNode;
  tone?: "due";
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate font-medium text-ink">
        {name}
        {strength && <span className="ml-1.5 text-[0.8125rem] font-normal text-muted">{strength}</span>}
      </p>
      <p className={`tnum mt-0.5 truncate text-[0.8125rem] ${tone === "due" ? "text-warning" : "text-muted"}`}>
        {meta}
      </p>
    </div>
  );
}

function DueRow({ slot: s, overdue }: { slot: DoseSlot; overdue?: boolean }) {
  const needsDose = s.medication.type === "variable" && s.plannedDose == null;
  const meta = (
    <>
      {overdue ? "Due · " : ""}
      {s.timeLabel}
      {s.plannedDose != null && ` · ${s.plannedDose} ${s.medication.unit}`}
      {needsDose && " · set today's dose"}
    </>
  );
  return (
    <li className="dose-row">
      <RowBody name={s.medication.name} strength={s.medication.strength} meta={meta} tone={overdue ? "due" : undefined} />
      <GiveDose
        medicationId={s.medication.id}
        medicationName={s.medication.name}
        scheduledFor={s.scheduledFor}
        defaultDose={s.plannedDose}
        unit={s.medication.unit}
        strength={s.medication.strength}
      />
    </li>
  );
}

function GivenRow({ slot: s }: { slot: DoseSlot }) {
  const log = s.log;
  const given = log ? DateTime.fromISO(log.given_at).setZone(appTimezone()) : null;
  const body = (
    <>
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
        <CheckIcon className="size-[1.15rem]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">
          {s.medication.name}
          {s.medication.strength && (
            <span className="ml-1.5 text-[0.8125rem] font-normal text-muted">{s.medication.strength}</span>
          )}
        </p>
        <p className="tnum mt-0.5 truncate text-[0.8125rem] text-muted">
          {s.timeLabel}
          {log?.dose_amount != null && ` · ${log.dose_amount} ${log.unit ?? s.medication.unit}`}
          {log?.given_by && ` · ${log.given_by}`}
          {log && ` · ${time(log.given_at)}`}
        </p>
      </div>
    </>
  );
  return (
    <li className="dose-row">
      {log ? (
        <GiveDose
          medicationId={s.medication.id}
          medicationName={s.medication.name}
          defaultDose={s.plannedDose}
          unit={s.medication.unit}
          strength={s.medication.strength}
          editLogId={log.id}
          initialDose={log.dose_amount}
          initialGivenBy={log.given_by}
          initialNotes={log.notes}
          initialDate={given!.toISODate()!}
          initialTime={given!.toFormat("HH:mm")}
          trigger={body}
        />
      ) : (
        body
      )}
      {log && <UndoDose logId={log.id} />}
    </li>
  );
}

function ExtraRow({ log, med }: { log: DoseLog; med?: Medication }) {
  const given = DateTime.fromISO(log.given_at).setZone(appTimezone());
  const name = med?.name ?? "—";
  const unit = log.unit ?? med?.unit ?? "";
  const body = (
    <>
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
        <CheckIcon className="size-[1.15rem]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">
          {name}
          {med?.strength && (
            <span className="ml-1.5 text-[0.8125rem] font-normal text-muted">{med.strength}</span>
          )}
        </p>
        <p className="tnum mt-0.5 truncate text-[0.8125rem] text-muted">
          {time(log.given_at)}
          {log.dose_amount != null && ` · ${log.dose_amount} ${unit}`}
          {log.given_by && ` · ${log.given_by}`}
        </p>
      </div>
    </>
  );
  return (
    <li className="dose-row">
      <GiveDose
        medicationId={log.medication_id}
        medicationName={name}
        defaultDose={log.dose_amount}
        unit={unit}
        strength={med?.strength}
        editLogId={log.id}
        initialDose={log.dose_amount}
        initialGivenBy={log.given_by}
        initialNotes={log.notes}
        initialDate={given.toISODate()!}
        initialTime={given.toFormat("HH:mm")}
        trigger={body}
      />
      <UndoDose logId={log.id} />
    </li>
  );
}

/* ---- Section + empty state ------------------------------------------------ */
function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "due";
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">
        {tone === "due" && <span aria-hidden className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-warning align-middle" />}
        {title}
      </h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center rounded-card bg-surface px-6 py-12 text-center" style={{ boxShadow: "var(--shadow-md)" }}>
      <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
        <PawIcon className="size-9" />
      </span>
      <h2 className="mt-4 font-display text-xl text-ink">Welcome to Pawscriptions</h2>
      <p className="mt-1.5 max-w-[16rem] text-sm text-muted">
        Add your dog&apos;s first medication and we&apos;ll keep track of every dose for you.
      </p>
      <Link
        href="/medications/new"
        className="tap mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent-hover"
      >
        <PlusIcon className="size-4" />
        Add a medication
      </Link>
    </div>
  );
}
