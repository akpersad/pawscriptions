import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { AppShell } from "@/components/AppShell";
import { getHistory, getMedication } from "@/lib/data";
import { nowInAppTz } from "@/lib/schedule";
import { appTimezone } from "@/lib/env";
import { ClockIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  fixed: "Fixed",
  variable: "Variable",
  as_needed: "As needed",
};

export default async function MedicationHistoryPage({
  params,
}: {
  params: Promise<{ medId: string }>;
}) {
  const { medId } = await params;
  const tz = appTimezone();

  const med = await getMedication(medId);
  if (!med) notFound();

  const logs = await getHistory({ medicationId: medId, limit: 1000 });

  // Summary stats, all in app tz.
  const now = nowInAppTz();
  const since7 = now.minus({ days: 7 });
  const since30 = now.minus({ days: 30 });
  const count = (since: DateTime) =>
    logs.filter((l) => DateTime.fromISO(l.given_at) >= since).length;
  const last = logs[0]; // getHistory returns newest first
  const lastLabel = last
    ? DateTime.fromISO(last.given_at).setZone(tz).toFormat("LLL d, h:mm a")
    : "—";

  // Group by local date for the running list.
  const groups = new Map<string, typeof logs>();
  for (const log of logs) {
    const key = DateTime.fromISO(log.given_at).setZone(tz).toFormat("cccc, LLL d, yyyy");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log);
  }

  return (
    <AppShell
      title={med.name}
      subtitle={[med.strength, TYPE_LABEL[med.type]].filter(Boolean).join(" · ")}
      back={{ href: "/history", label: "Back to history" }}
    >
      {/* Summary */}
      <section
        className="mb-6 rounded-card bg-surface p-4"
        style={{ boxShadow: "var(--shadow-md), var(--inner-highlight)" }}
      >
        <p className="text-[0.8125rem] text-muted">
          Last given <span className="font-medium text-ink">{lastLabel}</span>
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat value={count(since7)} label="last 7 days" />
          <Stat value={count(since30)} label="last 30 days" />
          <Stat value={logs.length} label="all time" />
        </div>
      </section>

      {logs.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-card bg-surface px-6 py-12 text-center" style={{ boxShadow: "var(--shadow-md)" }}>
          <span className="grid size-14 place-items-center rounded-full bg-surface-2 text-faint">
            <ClockIcon className="size-7" />
          </span>
          <p className="mt-4 font-medium text-ink">No doses logged yet</p>
          <p className="mt-1 max-w-[15rem] text-sm text-muted">
            Doses of {med.name} will appear here, newest first.
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
                      <p className="tnum font-medium text-ink">
                        {DateTime.fromISO(log.given_at).setZone(tz).toFormat("h:mm a")}
                        {log.dose_amount != null && (
                          <span className="font-normal text-muted"> · {log.dose_amount} {log.unit ?? med.unit}</span>
                        )}
                      </p>
                      {log.notes && <p className="mt-0.5 text-[0.8125rem] text-muted">{log.notes}</p>}
                      {log.given_by && (
                        <p className="mt-0.5 text-[0.75rem] text-faint">by {log.given_by}</p>
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

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-row bg-surface-2 px-2 py-3">
      <p className="tnum text-2xl font-semibold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[0.6875rem] font-medium uppercase tracking-[0.04em] text-muted">{label}</p>
    </div>
  );
}
