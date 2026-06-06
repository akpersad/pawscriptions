import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getMedicationsWithSchedules } from "@/lib/data";

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
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Add
        </Link>
      }
    >
      {meds.length === 0 ? (
        <p className="text-slate-500">No medications yet. Tap “Add” to start.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {meds.map((m) => (
            <li key={m.id}>
              <Link
                href={`/medications/${m.id}`}
                className={`block rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 ${
                  m.active ? "" : "opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{m.name}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {TYPE_LABEL[m.type]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {m.type === "as_needed"
                    ? "Given as needed"
                    : scheduleSummary(m.schedules.map((s) => s.time_of_day))}
                  {!m.active && " · inactive"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
