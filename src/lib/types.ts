export type MedType = "fixed" | "variable" | "as_needed";

export interface Medication {
  id: string;
  name: string;
  type: MedType;
  unit: string;
  default_dose: number | null;
  strength: string | null; // optional label, e.g. "25 mg"
  instructions: string | null;
  active: boolean;
  created_at: string;
}

export interface Schedule {
  id: string;
  medication_id: string;
  time_of_day: string; // "HH:MM:SS"
  days_of_week: number[] | null; // 0=Sun..6=Sat, null = every day
  created_at: string;
}

export interface DoseLog {
  id: string;
  medication_id: string;
  scheduled_for: string | null;
  given_at: string;
  dose_amount: number | null;
  unit: string | null;
  given_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface DailyDosePlan {
  id: string;
  medication_id: string;
  date: string; // YYYY-MM-DD
  planned_dose: number;
}

export interface MedicationWithSchedules extends Medication {
  schedules: Schedule[];
}

/** One expected dose slot for a given day, with whether it's been given. */
export interface DoseSlot {
  medication: Medication;
  scheduleId: string;
  scheduledFor: string; // ISO timestamp of the slot in absolute time
  timeLabel: string; // "8:00 AM"
  plannedDose: number | null;
  log: DoseLog | null; // present once given
}
