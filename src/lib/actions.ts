"use server";

import { revalidatePath } from "next/cache";
import { DateTime } from "luxon";
import { getSupabase } from "./supabase";
import { appTimezone } from "./env";
import type { MedType } from "./types";

interface ScheduleInput {
  time: string; // "HH:MM"
  days: number[] | null; // 0=Sun..6=Sat, null = every day
}

function parseSchedules(raw: FormDataEntryValue | null): ScheduleInput[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && typeof s.time === "string" && /^\d{2}:\d{2}/.test(s.time))
      .map((s) => ({
        time: s.time.slice(0, 5),
        days: Array.isArray(s.days) && s.days.length > 0 ? s.days.map(Number) : null,
      }));
  } catch {
    return [];
  }
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Build a UTC ISO timestamp from a wall-clock date ("YYYY-MM-DD") and time
 * ("HH:MM") entered by the user, interpreting them in APP_TIMEZONE (the dog's
 * local time) — not server-local time. Returns null if either is missing/invalid,
 * so the caller can fall back to the DB `now()` default.
 */
function buildGivenAt(
  date: FormDataEntryValue | null,
  time: FormDataEntryValue | null,
): string | null {
  const d = String(date ?? "").trim();
  const t = String(time ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !/^\d{2}:\d{2}/.test(t)) return null;
  const dt = DateTime.fromISO(`${d}T${t.slice(0, 5)}`, { zone: appTimezone() });
  return dt.isValid ? dt.toUTC().toISO() : null;
}

async function replaceSchedules(medicationId: string, schedules: ScheduleInput[]) {
  const supabase = getSupabase();
  await supabase.from("schedules").delete().eq("medication_id", medicationId);
  if (schedules.length > 0) {
    const { error } = await supabase.from("schedules").insert(
      schedules.map((s) => ({
        medication_id: medicationId,
        time_of_day: s.time,
        days_of_week: s.days,
      })),
    );
    if (error) throw error;
  }
}

export async function createMedication(formData: FormData) {
  const supabase = getSupabase();
  const type = String(formData.get("type")) as MedType;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Medication name is required.");
  const { data, error } = await supabase
    .from("medications")
    .insert({
      name,
      type,
      unit: String(formData.get("unit") ?? "pill").trim() || "pill",
      default_dose: numOrNull(formData.get("default_dose")),
      strength: String(formData.get("strength") ?? "").trim() || null,
      instructions: String(formData.get("instructions") ?? "").trim() || null,
      reminder_lead_minutes:
        type === "as_needed" ? 0 : numOrNull(formData.get("reminder_lead_minutes")) ?? 0,
      active: true,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (type !== "as_needed") {
    await replaceSchedules(data.id, parseSchedules(formData.get("schedules")));
  }
  revalidatePath("/medications");
  revalidatePath("/");
}

export async function updateMedication(id: string, formData: FormData) {
  const supabase = getSupabase();
  const type = String(formData.get("type")) as MedType;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Medication name is required.");
  const { error } = await supabase
    .from("medications")
    .update({
      name,
      type,
      unit: String(formData.get("unit") ?? "pill").trim() || "pill",
      default_dose: numOrNull(formData.get("default_dose")),
      strength: String(formData.get("strength") ?? "").trim() || null,
      instructions: String(formData.get("instructions") ?? "").trim() || null,
      reminder_lead_minutes:
        type === "as_needed" ? 0 : numOrNull(formData.get("reminder_lead_minutes")) ?? 0,
    })
    .eq("id", id);
  if (error) throw error;

  await replaceSchedules(
    id,
    type === "as_needed" ? [] : parseSchedules(formData.get("schedules")),
  );
  revalidatePath("/medications");
  revalidatePath("/");
}

export async function setMedicationActive(id: string, active: boolean) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("medications")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/medications");
  revalidatePath("/");
}

export async function deleteMedication(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("medications").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/medications");
  revalidatePath("/");
}

/** Log a dose. `scheduled_for` empty → as-needed / unscheduled. */
export async function logDose(formData: FormData) {
  const supabase = getSupabase();
  const scheduledFor = String(formData.get("scheduled_for") ?? "").trim();
  const givenAt = buildGivenAt(formData.get("given_date"), formData.get("given_time"));
  const { error } = await supabase.from("dose_logs").insert({
    medication_id: String(formData.get("medication_id")),
    scheduled_for: scheduledFor || null,
    // When the user noted a time, honor it (in app tz); else let the DB stamp now().
    ...(givenAt ? { given_at: givenAt } : {}),
    dose_amount: numOrNull(formData.get("dose_amount")),
    unit: String(formData.get("unit") ?? "").trim() || null,
    given_by: String(formData.get("given_by") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  // Unique-violation on (medication_id, scheduled_for) means it was already logged.
  if (error && error.code !== "23505") throw error;
  revalidatePath("/");
  revalidatePath("/history");
}

/**
 * Log a dose that isn't on the regular schedule. Either references a known med
 * (`medication_id`) or, when a free-typed `name` is given, auto-creates a hidden
 * `as_needed` med (`is_one_off`) so the dose has something to attribute to.
 */
export async function logAdHocDose(formData: FormData) {
  const supabase = getSupabase();
  let medicationId = String(formData.get("medication_id") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || "pill";

  if (!medicationId) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) throw new Error("A medication name is required.");
    const { data, error } = await supabase
      .from("medications")
      .insert({
        name,
        type: "as_needed",
        unit,
        strength: String(formData.get("strength") ?? "").trim() || null,
        active: true,
        is_one_off: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    medicationId = data.id;
  }

  const givenAt = buildGivenAt(formData.get("given_date"), formData.get("given_time"));
  const { error } = await supabase.from("dose_logs").insert({
    medication_id: medicationId,
    scheduled_for: null,
    ...(givenAt ? { given_at: givenAt } : {}),
    dose_amount: numOrNull(formData.get("dose_amount")),
    unit,
    given_by: String(formData.get("given_by") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/history");
}

/** Edit an already-logged dose (amount, time, who gave it, notes). */
export async function editDose(logId: string, formData: FormData) {
  const supabase = getSupabase();
  const givenAt = buildGivenAt(formData.get("given_date"), formData.get("given_time"));
  const { error } = await supabase
    .from("dose_logs")
    .update({
      dose_amount: numOrNull(formData.get("dose_amount")),
      ...(givenAt ? { given_at: givenAt } : {}),
      given_by: String(formData.get("given_by") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", logId);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/history");
}

export async function undoDose(logId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("dose_logs").delete().eq("id", logId);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/history");
}

/** Set the planned dose for a variable med on a specific day. */
export async function setDailyPlan(formData: FormData) {
  const supabase = getSupabase();
  const planned = numOrNull(formData.get("planned_dose"));
  const medication_id = String(formData.get("medication_id"));
  const date = String(formData.get("date"));
  if (planned == null) {
    await supabase
      .from("daily_dose_plan")
      .delete()
      .eq("medication_id", medication_id)
      .eq("date", date);
  } else {
    const { error } = await supabase
      .from("daily_dose_plan")
      .upsert(
        { medication_id, date, planned_dose: planned },
        { onConflict: "medication_id,date" },
      );
    if (error) throw error;
  }
  revalidatePath("/");
}
