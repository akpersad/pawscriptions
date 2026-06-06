import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MedicationForm } from "@/components/MedicationForm";
import { MedActions } from "@/components/MedActions";
import { getMedication } from "@/lib/data";
import { updateMedication } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function EditMedicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const med = await getMedication(id);
  if (!med) notFound();

  return (
    <AppShell
      title="Edit medication"
      action={
        <Link href="/medications" className="text-sm text-slate-500">
          Back
        </Link>
      }
    >
      <MedicationForm med={med} action={updateMedication.bind(null, med.id)} />
      <MedActions id={med.id} active={med.active} />
    </AppShell>
  );
}
