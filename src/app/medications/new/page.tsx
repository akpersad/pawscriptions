import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { MedicationForm } from "@/components/MedicationForm";
import { createMedication } from "@/lib/actions";

export default function NewMedicationPage() {
  return (
    <AppShell
      title="Add medication"
      action={
        <Link href="/medications" className="text-sm text-slate-500">
          Cancel
        </Link>
      }
    >
      <MedicationForm action={createMedication} />
    </AppShell>
  );
}
