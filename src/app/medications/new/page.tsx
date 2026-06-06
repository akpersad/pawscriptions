import { AppShell } from "@/components/AppShell";
import { MedicationForm } from "@/components/MedicationForm";
import { createMedication } from "@/lib/actions";

export default function NewMedicationPage() {
  return (
    <AppShell title="Add medication" back={{ href: "/medications", label: "Cancel" }}>
      <MedicationForm action={createMedication} />
    </AppShell>
  );
}
