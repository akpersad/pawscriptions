"use client";

import { useRouter } from "next/navigation";
import { deleteMedication, setMedicationActive } from "@/lib/actions";

export function MedActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  return (
    <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-4">
      <button
        onClick={() => setMedicationActive(id, !active)}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
      >
        {active ? "Mark inactive (hide from Today)" : "Reactivate"}
      </button>
      <button
        onClick={async () => {
          if (confirm("Delete this medication and all its dose history? This cannot be undone.")) {
            await deleteMedication(id);
            router.push("/medications");
          }
        }}
        className="rounded-lg px-4 py-2 text-sm font-medium text-red-600"
      >
        Delete medication
      </button>
    </div>
  );
}
