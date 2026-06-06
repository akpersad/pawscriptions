import { DateTime } from "luxon";
import { AppShell } from "@/components/AppShell";
import { getHistory, getMedicationsWithSchedules } from "@/lib/data";
import { appTimezone } from "@/lib/env";

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
      <form className="mb-4 flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
        <select name="med" defaultValue={med ?? ""} className="input">
          <option value="">All medications</option>
          {meds.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" name="from" defaultValue={from ?? ""} className="input" />
          <input type="date" name="to" defaultValue={to ?? ""} className="input" />
        </div>
        <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white">
          Apply filters
        </button>
      </form>

      {logs.length === 0 ? (
        <p className="text-slate-500">No doses logged for this filter.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {[...groups.entries()].map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {date}
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm shadow-sm ring-1 ring-slate-100"
                  >
                    <div>
                      <p className="font-medium">{nameOf.get(log.medication_id) ?? "—"}</p>
                      {log.notes && <p className="text-xs text-slate-400">{log.notes}</p>}
                    </div>
                    <div className="text-right text-slate-500">
                      <p>
                        {DateTime.fromISO(log.given_at).setZone(tz).toFormat("h:mm a")}
                        {log.dose_amount != null && ` · ${log.dose_amount} ${log.unit ?? ""}`}
                      </p>
                      {log.given_by && <p className="text-xs text-slate-400">by {log.given_by}</p>}
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
