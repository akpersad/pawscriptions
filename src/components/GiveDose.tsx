"use client";

import { useEffect, useState } from "react";
import { logDose } from "@/lib/actions";
import { MinusIcon, PlusIcon } from "./icons";

const GIVER_KEY = "pawscriptions_giver";

const pad = (n: number) => String(n).padStart(2, "0");
/** Current local wall-clock date/time, for prefilling the "given at" fields. */
function nowParts() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function GiveDose({
  medicationId,
  medicationName,
  scheduledFor,
  defaultDose,
  unit,
  label = "Give",
}: {
  medicationId: string;
  medicationName: string;
  scheduledFor?: string;
  defaultDose: number | null;
  unit: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [dose, setDose] = useState<string>(defaultDose != null ? String(defaultDose) : "");
  const [givenBy, setGivenBy] = useState("");
  const [notes, setNotes] = useState("");
  const [givenDate, setGivenDate] = useState("");
  const [givenTime, setGivenTime] = useState("");

  // Open/close with an enter/exit transition; lock body scroll while open.
  function openSheet() {
    setDose(defaultDose != null ? String(defaultDose) : "");
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

  function step(delta: number) {
    setDose((d) => {
      const n = (parseFloat(d) || 0) + delta;
      return String(Math.max(0, Math.round(n * 100) / 100));
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData();
    fd.set("medication_id", medicationId);
    if (scheduledFor) fd.set("scheduled_for", scheduledFor);
    fd.set("unit", unit);
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
      await logDose(fd);
      closeSheet();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        onClick={openSheet}
        className="tap shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent-hover"
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={`Log dose for ${medicationName}`}>
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
              <p className="text-[0.75rem] font-medium uppercase tracking-[0.06em] text-muted">Log dose</p>
              <p className="truncate text-lg font-semibold text-ink">{medicationName}</p>
            </div>

            {/* Dose stepper */}
            <div className="mb-3 flex items-center justify-between gap-3 rounded-row bg-surface-2 p-3">
              <span className="text-sm font-medium text-muted">Dose ({unit})</span>
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

            {/* Time given — defaults to now, but editable so you can log the
                actual time rather than when you happened to open the app. */}
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

            <label className="mb-2 block">
              <span className="sr-only">Given by</span>
              <input
                value={givenBy}
                onChange={(e) => setGivenBy(e.target.value)}
                placeholder="Given by (name)"
                className="input"
              />
            </label>
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
                {pending ? "Saving…" : "Confirm dose"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
