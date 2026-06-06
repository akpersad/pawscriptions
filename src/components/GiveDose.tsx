"use client";

import { useEffect, useRef, useState } from "react";
import { logDose } from "@/lib/actions";

const GIVER_KEY = "pawscriptions_giver";

export function GiveDose({
  medicationId,
  scheduledFor,
  defaultDose,
  unit,
  label = "Give",
}: {
  medicationId: string;
  scheduledFor?: string;
  defaultDose: number | null;
  unit: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const giverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && giverRef.current && !giverRef.current.value) {
      giverRef.current.value = localStorage.getItem(GIVER_KEY) ?? "";
    }
  }, [open]);

  async function action(formData: FormData) {
    setPending(true);
    const giver = String(formData.get("given_by") ?? "");
    if (giver) localStorage.setItem(GIVER_KEY, giver);
    try {
      await logDose(formData);
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
      >
        {label}
      </button>
    );
  }

  return (
    <form action={action} className="mt-2 flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
      <input type="hidden" name="medication_id" value={medicationId} />
      {scheduledFor && <input type="hidden" name="scheduled_for" value={scheduledFor} />}
      <input type="hidden" name="unit" value={unit} />
      <label className="flex items-center justify-between gap-2 text-sm">
        <span className="text-slate-600">Dose ({unit})</span>
        <input
          name="dose_amount"
          type="number"
          step="any"
          defaultValue={defaultDose ?? ""}
          className="w-24 rounded border border-slate-300 px-2 py-1 text-right"
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-sm">
        <span className="text-slate-600">Given by</span>
        <input
          ref={giverRef}
          name="given_by"
          placeholder="name"
          className="w-32 rounded border border-slate-300 px-2 py-1"
        />
      </label>
      <input
        name="notes"
        placeholder="Notes (optional)"
        className="rounded border border-slate-300 px-2 py-1 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-2 text-sm text-slate-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
