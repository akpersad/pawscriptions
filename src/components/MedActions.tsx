"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMedication, setMedicationActive } from "@/lib/actions";
import { TrashIcon } from "./icons";

export function MedActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await setMedicationActive(id, !active);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    try {
      await deleteMedication(id);
      router.push("/medications");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-2.5">
      <button
        onClick={toggle}
        disabled={pending}
        className="tap rounded-full border border-border bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-surface-2 disabled:opacity-60"
      >
        {active ? "Mark inactive — hide from Today" : "Reactivate"}
      </button>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="tap inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-sm font-medium text-danger hover:bg-danger-soft"
        >
          <TrashIcon className="size-4" />
          Delete medication
        </button>
      ) : (
        <div className="rounded-card bg-danger-soft p-4 text-center">
          <p className="text-sm font-medium text-ink">Delete this medication?</p>
          <p className="mt-1 text-[0.8125rem] text-muted">
            Its entire dose history will be removed. This can&apos;t be undone.
          </p>
          <div className="mt-3 flex gap-2.5">
            <button
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="tap flex-1 rounded-full border border-border bg-surface py-2.5 text-sm font-medium text-ink"
            >
              Cancel
            </button>
            <button
              onClick={remove}
              disabled={pending}
              className="tap flex-1 rounded-full bg-danger py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
