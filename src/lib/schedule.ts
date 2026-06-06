import { DateTime } from "luxon";
import { appTimezone } from "./env";
import type {
  DailyDosePlan,
  DoseLog,
  DoseSlot,
  MedicationWithSchedules,
  Schedule,
} from "./types";

/** "now" as a luxon DateTime in the app timezone. */
export function nowInAppTz(): DateTime {
  return DateTime.now().setZone(appTimezone());
}

/** Parse "HH:MM:SS" / "HH:MM" into {hour, minute}. */
function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(":");
  return { hour: Number(h), minute: Number(m) };
}

/** Does this schedule fire on the given weekday (0=Sun..6=Sat)? */
function firesOn(schedule: Schedule, weekday0Sun: number): boolean {
  if (!schedule.days_of_week || schedule.days_of_week.length === 0) return true;
  return schedule.days_of_week.includes(weekday0Sun);
}

/** Absolute timestamp of a schedule's slot on a given local day. */
export function slotDateTime(timeOfDay: string, day: DateTime): DateTime {
  const { hour, minute } = parseTime(timeOfDay);
  return day.set({ hour, minute, second: 0, millisecond: 0 });
}

/**
 * Build the expected dose slots for `day` (defaults to today in app tz) from the
 * scheduled meds, matched against the day's dose logs and any variable-dose plans.
 */
export function buildDoseSlots(
  meds: MedicationWithSchedules[],
  logs: DoseLog[],
  plans: DailyDosePlan[],
  day: DateTime = nowInAppTz(),
): DoseSlot[] {
  const localDay = day.setZone(appTimezone());
  // luxon weekday: 1=Mon..7=Sun → convert to 0=Sun..6=Sat
  const weekday0Sun = localDay.weekday % 7;
  const dateKey = localDay.toISODate();

  const slots: DoseSlot[] = [];

  for (const med of meds) {
    if (!med.active || med.type === "as_needed") continue;

    const plan = plans.find(
      (p) => p.medication_id === med.id && p.date === dateKey,
    );
    const plannedDose = plan?.planned_dose ?? med.default_dose ?? null;

    for (const schedule of med.schedules) {
      if (!firesOn(schedule, weekday0Sun)) continue;

      const slot = slotDateTime(schedule.time_of_day, localDay);
      const scheduledFor = slot.toUTC().toISO()!;

      const log =
        logs.find(
          (l) =>
            l.medication_id === med.id &&
            l.scheduled_for != null &&
            DateTime.fromISO(l.scheduled_for).toMillis() === slot.toMillis(),
        ) ?? null;

      slots.push({
        medication: med,
        scheduleId: schedule.id,
        scheduledFor,
        timeLabel: slot.toFormat("h:mm a"),
        plannedDose,
        log,
      });
    }
  }

  slots.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  return slots;
}

/**
 * Slots that are "due now" for the reminder cron: their scheduled time has arrived
 * within the last `windowMinutes` and they haven't been given. Caller is responsible
 * for skipping any already in notifications_sent.
 */
export function dueNowSlots(
  slots: DoseSlot[],
  now: DateTime = nowInAppTz(),
  windowMinutes = 5,
): DoseSlot[] {
  return slots.filter((s) => {
    if (s.log) return false; // already given
    const slotTime = DateTime.fromISO(s.scheduledFor);
    const minutesPast = now.diff(slotTime, "minutes").minutes;
    return minutesPast >= 0 && minutesPast < windowMinutes;
  });
}
