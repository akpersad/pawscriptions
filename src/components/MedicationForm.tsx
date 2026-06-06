"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MedType, MedicationWithSchedules } from "@/lib/types";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]; // index = 0..6 (Sun..Sat)

interface Row {
  time: string;
  days: number[]; // empty = every day
}

function toRows(med?: MedicationWithSchedules): Row[] {
  if (!med || med.schedules.length === 0) return [{ time: "08:00", days: [] }];
  return med.schedules.map((s) => ({
    time: s.time_of_day.slice(0, 5),
    days: s.days_of_week ?? [],
  }));
}

export function MedicationForm({
  med,
  action,
}: {
  med?: MedicationWithSchedules;
  action: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [type, setType] = useState<MedType>(med?.type ?? "fixed");
  const [rows, setRows] = useState<Row[]>(toRows(med));
  const [pending, setPending] = useState(false);

  const showSchedule = type !== "as_needed";

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function toggleDay(i: number, day: number) {
    setRows((rs) =>
      rs.map((r, idx) =>
        idx === i
          ? {
              ...r,
              days: r.days.includes(day)
                ? r.days.filter((d) => d !== day)
                : [...r.days, day].sort(),
            }
          : r,
      ),
    );
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    formData.set(
      "schedules",
      JSON.stringify(
        rows.map((r) => ({ time: r.time, days: r.days.length === 7 ? [] : r.days })),
      ),
    );
    try {
      await action(formData);
      router.push("/medications");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <Field label="Name">
        <input
          name="name"
          required
          defaultValue={med?.name}
          className="input"
          placeholder="e.g. Apoquel"
        />
      </Field>

      <Field label="Type">
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as MedType)}
          className="input"
        >
          <option value="fixed">Fixed — same dose at set times</option>
          <option value="variable">Variable — dose changes by day</option>
          <option value="as_needed">As needed — no schedule</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Unit">
          <input name="unit" defaultValue={med?.unit ?? "pill"} className="input" />
        </Field>
        <Field label={type === "variable" ? "Default dose" : "Dose"}>
          <input
            name="default_dose"
            type="number"
            step="any"
            defaultValue={med?.default_dose ?? ""}
            className="input"
            placeholder="e.g. 1"
          />
        </Field>
      </div>

      <Field label="Instructions (optional)">
        <textarea
          name="instructions"
          defaultValue={med?.instructions ?? ""}
          rows={2}
          className="input"
          placeholder="With food, etc."
        />
      </Field>

      {showSchedule && (
        <div>
          <p className="mb-1 text-sm font-medium text-slate-600">Times</p>
          <div className="flex flex-col gap-3">
            {rows.map((row, i) => (
              <div key={i} className="rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={row.time}
                    onChange={(e) => updateRow(i, { time: e.target.value })}
                    className="input flex-1"
                  />
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                      className="px-2 text-slate-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="mt-2 flex gap-1">
                  {DAY_LABELS.map((d, day) => {
                    const on = row.days.length === 0 || row.days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(i, day)}
                        className={`h-7 w-7 rounded-full text-xs ${
                          on ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {row.days.length === 0 ? "Every day" : "Selected days only"}
                </p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, { time: "20:00", days: [] }])}
            className="mt-2 text-sm font-medium text-teal-700"
          >
            + Add another time
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-teal-600 px-4 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : med ? "Save changes" : "Add medication"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
