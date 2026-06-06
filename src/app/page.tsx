import Link from "next/link";
import { DateTime } from "luxon";
import { AppShell } from "@/components/AppShell";
import { GiveDose } from "@/components/GiveDose";
import { UndoDose } from "@/components/UndoDose";
import {
  getDailyPlans,
  getDoseLogsForDay,
  getMedicationsWithSchedules,
} from "@/lib/data";
import { buildDoseSlots, nowInAppTz } from "@/lib/schedule";
import { appTimezone } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const today = nowInAppTz();
  const [meds, logs, plans] = await Promise.all([
    getMedicationsWithSchedules({ activeOnly: true }),
    getDoseLogsForDay(today),
    getDailyPlans(today.toISODate()!),
  ]);

  const slots = buildDoseSlots(meds, logs, plans, today);
  const asNeeded = meds.filter((m) => m.type === "as_needed");
  const given = slots.filter((s) => s.log);
  const outstanding = slots.filter((s) => !s.log);

  return (
    <AppShell title="Today">
      <p className="mb-4 text-sm text-slate-500">
        {today.toFormat("cccc, LLLL d")} · {appTimezone().split("/")[1]?.replace("_", " ")}
      </p>

      {meds.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Summary givenCount={given.length} total={slots.length} />

          {outstanding.length > 0 && (
            <Section title="Due today">
              {outstanding.map((s) => (
                <li key={s.scheduleId + s.scheduledFor} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{s.medication.name}</p>
                      <p className="text-sm text-slate-500">
                        {s.timeLabel}
                        {s.plannedDose != null && ` · ${s.plannedDose} ${s.medication.unit}`}
                        {s.medication.type === "variable" && s.plannedDose == null && (
                          <span className="text-amber-600"> · set today&apos;s dose</span>
                        )}
                      </p>
                    </div>
                    <GiveDose
                      medicationId={s.medication.id}
                      scheduledFor={s.scheduledFor}
                      defaultDose={s.plannedDose}
                      unit={s.medication.unit}
                    />
                  </div>
                </li>
              ))}
            </Section>
          )}

          {given.length > 0 && (
            <Section title="Given">
              {given.map((s) => (
                <li key={s.scheduleId + s.scheduledFor} className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-100">
                  <div>
                    <p className="font-medium text-slate-700">
                      <span className="mr-1 text-teal-600">✓</span>
                      {s.medication.name}
                    </p>
                    <p className="text-slate-500">
                      {s.timeLabel}
                      {s.log?.dose_amount != null && ` · ${s.log.dose_amount} ${s.log.unit ?? s.medication.unit}`}
                      {s.log?.given_by && ` · ${s.log.given_by}`}
                      {s.log && ` · ${DateTime.fromISO(s.log.given_at).setZone(appTimezone()).toFormat("h:mm a")}`}
                    </p>
                  </div>
                  {s.log && <UndoDose logId={s.log.id} />}
                </li>
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
              <li key={m.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-slate-500">
                      {todays.length === 0
                        ? "Not given today"
                        : `Given ${todays.length}× today · last ${DateTime.fromISO(last.given_at).setZone(appTimezone()).toFormat("h:mm a")}`}
                    </p>
                  </div>
                  <GiveDose
                    medicationId={m.id}
                    defaultDose={m.default_dose}
                    unit={m.unit}
                    label="Give now"
                  />
                </div>
              </li>
            );
          })}
        </Section>
      )}
    </AppShell>
  );
}

function Summary({ givenCount, total }: { givenCount: number; total: number }) {
  if (total === 0) {
    return (
      <div className="mb-4 rounded-xl bg-teal-50 p-4 text-sm text-teal-800 ring-1 ring-teal-100">
        No scheduled doses today.
      </div>
    );
  }
  const done = givenCount >= total;
  return (
    <div
      className={`mb-4 rounded-xl p-4 text-sm ring-1 ${
        done
          ? "bg-teal-50 text-teal-800 ring-teal-100"
          : "bg-amber-50 text-amber-800 ring-amber-100"
      }`}
    >
      {done ? "🎉 All caught up — every scheduled dose is done." : `${givenCount} of ${total} scheduled doses given.`}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
      <p className="text-slate-600">No medications yet.</p>
      <Link
        href="/medications"
        className="mt-3 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white"
      >
        Add a medication
      </Link>
    </div>
  );
}
