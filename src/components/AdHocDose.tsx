"use client";

import { useEffect, useState } from "react";
import { logAdHocDose } from "@/lib/actions";
import { GiverField } from "./GiverField";
import { MinusIcon, PlusIcon } from "./icons";

const GIVER_KEY = "pawscriptions_giver";

const pad = (n: number) => String(n).padStart(2, "0");
function nowParts() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export interface KnownMed {
  id: string;
  name: string;
  unit: string;
  strength: string | null;
  defaultDose: number | null;
}

/**
 * Log a dose that isn't on the regular schedule. Pick a known med or type a
 * brand-new one-off (name/unit/strength). The dose is attributed to the chosen
 * or freshly-created med via the logAdHocDose server action.
 */
export function AdHocDose({ meds }: { meds: KnownMed[] }) {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);

  const [selectedId, setSelectedId] = useState(""); // "" = new one-off
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pill");
  const [strength, setStrength] = useState("");
  const [dose, setDose] = useState("");
  const [givenBy, setGivenBy] = useState("");
  const [notes, setNotes] = useState("");
  const [givenDate, setGivenDate] = useState("");
  const [givenTime, setGivenTime] = useState("");

  const isNew = selectedId === "";
  const selected = meds.find((m) => m.id === selectedId);

  function openSheet() {
    setSelectedId("");
    setName("");
    setUnit("pill");
    setStrength("");
    setDose("");
    setNotes("");
    setGivenBy(typeof window !== "undefined" ? localStorage.getItem(GIVER_KEY) ?? "" : "");
    const { date, time } = nowParts();
    setGivenDate(date);
    setGivenTime(time);
    setOpen(true);
  }
  function closeSheet() {
    setShow(false);
    setTimeout(() => setOpen(false), 200);
  }

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setShow(true));
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSheet();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pickMed(id: string) {
    setSelectedId(id);
    const m = meds.find((x) => x.id === id);
    if (m) {
      setUnit(m.unit);
      setDose(m.defaultDose != null ? String(m.defaultDose) : "");
    } else {
      setUnit("pill");
      setDose("");
    }
  }

  function step(delta: number) {
    setDose((d) => {
      const n = (parseFloat(d) || 0) + delta;
      return String(Math.max(0, Math.round(n * 100) / 100));
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isNew && !name.trim()) return;
    setPending(true);
    const fd = new FormData();
    const effectiveUnit = selected ? selected.unit : unit;
    if (selected) {
      fd.set("medication_id", selected.id);
    } else {
      fd.set("name", name.trim());
      if (strength.trim()) fd.set("strength", strength.trim());
    }
    fd.set("unit", effectiveUnit || "pill");
    if (dose !== "") fd.set("dose_amount", dose);
    if (givenDate && givenTime) {
      fd.set("given_date", givenDate);
      fd.set("given_time", givenTime);
    }
    if (givenBy) {
      fd.set("given_by", givenBy);
      localStorage.setItem(GIVER_KEY, givenBy);
    }
    if (notes) fd.set("notes", notes);
    try {
      await logAdHocDose(fd);
      closeSheet();
    } finally {
      setPending(false);
    }
  }

  const displayUnit = selected ? selected.unit : unit || "pill";

  return (
    <>
      <button
        onClick={openSheet}
        className="tap flex w-full items-center justify-center gap-1.5 rounded-row border border-dashed border-border-strong py-3 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
      >
        <PlusIcon className="size-4" />
        Log a one-off dose
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Log a one-off dose">
          <button
            aria-label="Close"
            onClick={closeSheet}
            className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-200 ${show ? "opacity-100" : "opacity-0"}`}
          />
          <form
            onSubmit={submit}
            className="glass relative mx-auto w-full max-w-md rounded-t-sheet border-t border-glass-border px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3"
            style={{
              boxShadow: "var(--shadow-lg)",
              transform: show ? "translateY(0)" : "translateY(100%)",
              transition: "transform 0.28s var(--ease-out-quint)",
            }}
          >
            <div aria-hidden className="mx-auto mb-4 h-1 w-9 rounded-full bg-border-strong" />
            <div className="mb-4">
              <p className="text-[0.75rem] font-medium uppercase tracking-[0.06em] text-muted">One-off dose</p>
              <p className="text-lg font-semibold text-ink">Something off-schedule</p>
            </div>

            {/* Med selector — known med or a new one-off */}
            <label className="mb-2 block">
              <span className="sr-only">Medication</span>
              <select
                value={selectedId}
                onChange={(e) => pickMed(e.target.value)}
                className="input"
              >
                <option value="">＋ New / one-off…</option>
                {meds.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.strength ? ` (${m.strength})` : ""}
                  </option>
                ))}
              </select>
            </label>

            {isNew && (
              <div className="mb-2 grid grid-cols-1 gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name (e.g. Benadryl)"
                  required
                  className="input"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Unit (e.g. pill)"
                    className="input"
                  />
                  <input
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="Strength (e.g. 25 mg)"
                    className="input"
                  />
                </div>
              </div>
            )}

            {/* Dose stepper */}
            <div className="mb-3 flex items-center justify-between gap-3 rounded-row bg-surface-2 p-3">
              <span className="text-sm font-medium text-muted">Dose ({displayUnit})</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => step(-1)} className="tap grid size-9 place-items-center rounded-full bg-surface text-ink shadow-[var(--shadow-sm)] hover:text-accent" aria-label="Decrease dose">
                  <MinusIcon className="size-4" />
                </button>
                <input
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  inputMode="decimal"
                  placeholder="—"
                  aria-label="Dose amount"
                  className="tnum w-16 bg-transparent text-center text-xl font-semibold text-ink outline-none"
                />
                <button type="button" onClick={() => step(1)} className="tap grid size-9 place-items-center rounded-full bg-surface text-ink shadow-[var(--shadow-sm)] hover:text-accent" aria-label="Increase dose">
                  <PlusIcon className="size-4" />
                </button>
              </div>
            </div>

            {/* Time given */}
            <div className="mb-3 flex items-center justify-between gap-3 rounded-row bg-surface-2 p-3">
              <span className="text-sm font-medium text-muted">Time given</span>
              <input
                type="time"
                value={givenTime}
                onChange={(e) => setGivenTime(e.target.value)}
                aria-label="Time given"
                className="input tnum w-auto"
              />
            </div>

            <GiverField initial={givenBy} onChange={setGivenBy} />
            <label className="mb-4 block">
              <span className="sr-only">Notes</span>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="input"
              />
            </label>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={closeSheet}
                className="tap rounded-full px-5 py-3 text-sm font-medium text-muted hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="tap flex-1 rounded-full bg-accent py-3 text-sm font-semibold text-accent-ink hover:bg-accent-hover disabled:opacity-60"
              >
                {pending ? "Saving…" : "Log dose"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
