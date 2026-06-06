import "server-only";
import { DateTime } from "luxon";
import { getSupabase } from "./supabase";
import { appTimezone } from "./env";
import type {
  DailyDosePlan,
  DoseLog,
  Medication,
  MedicationWithSchedules,
  Schedule,
} from "./types";

export async function getMedicationsWithSchedules(
  opts: { activeOnly?: boolean; includeOneOff?: boolean } = {},
): Promise<MedicationWithSchedules[]> {
  const supabase = getSupabase();
  let medQuery = supabase.from("medications").select("*").order("name");
  if (opts.activeOnly) medQuery = medQuery.eq("active", true);
  // Ad-hoc one-off meds are hidden from management lists/pickers by default;
  // callers that need them (Today, history name lookup) opt in.
  if (opts.includeOneOff === false) medQuery = medQuery.eq("is_one_off", false);

  const [{ data: meds, error: medErr }, { data: schedules, error: schErr }] =
    await Promise.all([
      medQuery,
      supabase.from("schedules").select("*").order("time_of_day"),
    ]);
  if (medErr) throw medErr;
  if (schErr) throw schErr;

  return (meds ?? []).map((m: Medication) => ({
    ...m,
    schedules: (schedules ?? []).filter(
      (s: Schedule) => s.medication_id === m.id,
    ),
  }));
}

export async function getMedication(
  id: string,
): Promise<MedicationWithSchedules | null> {
  const supabase = getSupabase();
  const { data: med, error } = await supabase
    .from("medications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!med) return null;
  const { data: schedules, error: schErr } = await supabase
    .from("schedules")
    .select("*")
    .eq("medication_id", id)
    .order("time_of_day");
  if (schErr) throw schErr;
  return { ...(med as Medication), schedules: (schedules ?? []) as Schedule[] };
}

/** Logs whose given_at falls on the given local day (default today). */
export async function getDoseLogsForDay(
  day: DateTime = DateTime.now().setZone(appTimezone()),
): Promise<DoseLog[]> {
  const start = day.setZone(appTimezone()).startOf("day").toUTC().toISO()!;
  const end = day.setZone(appTimezone()).endOf("day").toUTC().toISO()!;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("dose_logs")
    .select("*")
    .gte("given_at", start)
    .lte("given_at", end);
  if (error) throw error;
  return (data ?? []) as DoseLog[];
}

/** Logs satisfying a scheduled slot on the given local day (for cron matching). */
export async function getScheduledLogsForDay(
  day: DateTime,
): Promise<DoseLog[]> {
  const start = day.setZone(appTimezone()).startOf("day").toUTC().toISO()!;
  const end = day.setZone(appTimezone()).endOf("day").toUTC().toISO()!;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("dose_logs")
    .select("*")
    .not("scheduled_for", "is", null)
    .gte("scheduled_for", start)
    .lte("scheduled_for", end);
  if (error) throw error;
  return (data ?? []) as DoseLog[];
}

export async function getDailyPlans(
  dateKey: string,
): Promise<DailyDosePlan[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("daily_dose_plan")
    .select("*")
    .eq("date", dateKey);
  if (error) throw error;
  return (data ?? []) as DailyDosePlan[];
}

export interface HistoryFilters {
  medicationId?: string;
  from?: string; // ISO
  to?: string; // ISO
  limit?: number;
}

export async function getHistory(
  filters: HistoryFilters = {},
): Promise<DoseLog[]> {
  const supabase = getSupabase();
  let q = supabase
    .from("dose_logs")
    .select("*")
    .order("given_at", { ascending: false })
    .limit(filters.limit ?? 200);
  if (filters.medicationId) q = q.eq("medication_id", filters.medicationId);
  if (filters.from) q = q.gte("given_at", filters.from);
  if (filters.to) q = q.lte("given_at", filters.to);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DoseLog[];
}
