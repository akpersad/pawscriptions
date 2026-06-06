import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getMedicationsWithSchedules } from "@/lib/data";
import { ChevronRightIcon, PawIcon, PlusIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  fixed: "Fixed",
  variable: "Variable",
  as_needed: "As needed",
};

function scheduleSummary(times: string[]): string {
  if (times.length === 0) return "No set times";
  return times
    .map((t) => {
      const [h, m] = t.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const hr = h % 12 || 12;
      return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
    })
    .join(", ");
}

export default async function MedicationsPage() {
  const meds = await getMedicationsWithSchedules();

  return (
    <AppShell
      title="Medications"
      action={
        <Link
          href="/medications/new"
          className="tap inline-flex items-center gap-1 rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-ink hover:bg-accent-hover"
        >
          <PlusIcon className="size-4" />
          Add
        </Link>
      }
    >
      {meds.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-card bg-surface px-6 py-12 text-center" style={{ boxShadow: "var(--shadow-md)" }}>
          <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
            <PawIcon className="size-8" />
          </span>
          <p className="mt-4 font-medium text-ink">No medications yet</p>
          <p className="mt-1 max-w-[15rem] text-sm text-muted">
            Add a medication to define its schedule and start logging doses.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {meds.map((m) => (
            <li key={m.id}>
              <Link
                href={`/medications/${m.id}`}
                className={`dose-row tap hover:bg-surface-2 ${m.active ? "" : "opacity-60"}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-ink">{m.name}</p>
                    <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-medium text-muted ring-1 ring-border">
                      {TYPE_LABEL[m.type]}
                    </span>
                    {!m.active && (
                      <span className="shrink-0 text-[0.6875rem] font-medium uppercase tracking-wide text-faint">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="tnum mt-0.5 truncate text-[0.8125rem] text-muted">
                    {m.type === "as_needed"
                      ? "Given as needed"
                      : scheduleSummary(m.schedules.map((s) => s.time_of_day))}
                  </p>
                </div>
                <ChevronRightIcon className="size-5 shrink-0 text-faint" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
