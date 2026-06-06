"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MedType, MedicationWithSchedules } from "@/lib/types";
import { PlusIcon, XIcon } from "./icons";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]; // index = 0..6 (Sun..Sat)

const TYPES: { value: MedType; label: string; hint: string }[] = [
  { value: "fixed", label: "Fixed", hint: "Same dose at set times each day." },
  { value: "variable", label: "Variable", hint: "Dose changes day to day; set it when you give it." },
  { value: "as_needed", label: "As needed", hint: "No schedule — give it whenever it's needed." },
];

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
  const typeHint = TYPES.find((t) => t.value === type)!.hint;

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
    formData.set("type", type);
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
    <form action={onSubmit} className="flex flex-col gap-5">
      <Group>
        <Field label="Name">
          <input name="name" required defaultValue={med?.name} className="input" placeholder="e.g. Apoquel" />
        </Field>

        <Field label="Type">
          <div role="radiogroup" className="grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1">
            {TYPES.map((t) => {
              const active = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setType(t.value)}
                  className={`tap rounded-full py-1.5 text-[0.8125rem] font-medium ${
                    active ? "bg-surface text-ink shadow-[var(--shadow-sm)]" : "text-muted"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[0.8125rem] text-muted">{typeHint}</p>
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
              className="input tnum"
              placeholder="e.g. 1"
            />
          </Field>
        </div>

        <Field label="Instructions (optional)">
          <textarea
            name="instructions"
            defaultValue={med?.instructions ?? ""}
            rows={2}
            className="input resize-none"
            placeholder="With food, etc."
          />
        </Field>
      </Group>

      {showSchedule && (
        <div>
          <p className="mb-2 px-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">
            Times
          </p>
          <div className="flex flex-col gap-2.5">
            {rows.map((row, i) => (
              <div key={i} className="rounded-row bg-surface p-3.5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={row.time}
                    onChange={(e) => updateRow(i, { time: e.target.value })}
                    className="input tnum flex-1"
                  />
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                      aria-label="Remove time"
                      className="tap grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-danger"
                    >
                      <XIcon className="size-4" />
                    </button>
                  )}
                </div>
                <div className="mt-3 flex justify-between gap-1">
                  {DAY_LABELS.map((d, day) => {
                    const on = row.days.length === 0 || row.days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(i, day)}
                        aria-pressed={on}
                        className={`tap size-8 rounded-full text-[0.8125rem] font-medium ${
                          on ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[0.75rem] text-muted">
                  {row.days.length === 0 ? "Every day" : "Selected days only"}
                </p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, { time: "20:00", days: [] }])}
            className="tap mt-2.5 inline-flex items-center gap-1.5 px-1 text-sm font-semibold text-accent"
          >
            <PlusIcon className="size-4" />
            Add another time
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="tap rounded-full bg-accent py-3.5 font-semibold text-accent-ink hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Saving…" : med ? "Save changes" : "Add medication"}
      </button>
    </form>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-[var(--shadow-sm)]">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.8125rem] font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
