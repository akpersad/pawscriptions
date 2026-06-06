import { DateTime } from "luxon";
import { AppShell } from "@/components/AppShell";
import { getHistory, getMedicationsWithSchedules } from "@/lib/data";
import { appTimezone } from "@/lib/env";
import { ClockIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ med?: string; from?: string; to?: string }>;
}) {
  const { med, from, to } = await searchParams;
  const tz = appTimezone();

  const fromIso = from
    ? DateTime.fromISO(from, { zone: tz }).startOf("day").toUTC().toISO()!
    : undefined;
  const toIso = to
    ? DateTime.fromISO(to, { zone: tz }).endOf("day").toUTC().toISO()!
    : undefined;

  const [meds, logs] = await Promise.all([
    getMedicationsWithSchedules(),
    getHistory({ medicationId: med || undefined, from: fromIso, to: toIso }),
  ]);

  const nameOf = new Map(meds.map((m) => [m.id, m.name]));

  // Group by local date.
  const groups = new Map<string, typeof logs>();
  for (const log of logs) {
    const key = DateTime.fromISO(log.given_at).setZone(tz).toFormat("cccc, LLL d, yyyy");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log);
  }

  return (
    <AppShell title="History">
      <form className="mb-6 flex flex-col gap-2.5 rounded-card bg-surface p-3.5 shadow-[var(--shadow-sm)]">
        <select name="med" defaultValue={med ?? ""} className="input">
          <option value="">All medications</option>
          {meds.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2.5">
          <input type="date" name="from" defaultValue={from ?? ""} className="input tnum min-w-0" />
          <input type="date" name="to" defaultValue={to ?? ""} className="input tnum min-w-0" />
        </div>
        <button className="tap rounded-full bg-ink px-3 py-2.5 text-sm font-semibold text-bg hover:opacity-90">
          Apply filters
        </button>
      </form>

      {logs.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-card bg-surface px-6 py-12 text-center" style={{ boxShadow: "var(--shadow-md)" }}>
          <span className="grid size-14 place-items-center rounded-full bg-surface-2 text-faint">
            <ClockIcon className="size-7" />
          </span>
          <p className="mt-4 font-medium text-ink">No doses logged</p>
          <p className="mt-1 max-w-[15rem] text-sm text-muted">
            Doses you give will appear here, newest first.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {[...groups.entries()].map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-2 px-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">
                {date}
              </h2>
              <ul className="overflow-hidden rounded-card bg-surface shadow-[var(--shadow-sm)]">
                {items.map((log, i) => (
                  <li
                    key={log.id}
                    className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{nameOf.get(log.medication_id) ?? "—"}</p>
                      {log.notes && <p className="mt-0.5 text-[0.8125rem] text-muted">{log.notes}</p>}
                      {log.given_by && (
                        <p className="mt-0.5 text-[0.75rem] text-faint">by {log.given_by}</p>
                      )}
                    </div>
                    <div className="tnum shrink-0 text-right text-[0.8125rem] text-muted">
                      <p>{DateTime.fromISO(log.given_at).setZone(tz).toFormat("h:mm a")}</p>
                      {log.dose_amount != null && (
                        <p className="text-faint">{log.dose_amount} {log.unit ?? ""}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
