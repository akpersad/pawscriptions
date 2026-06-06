import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { getSupabase } from "@/lib/supabase";
import {
  getDailyPlans,
  getMedicationsWithSchedules,
  getScheduledLogsForDay,
} from "@/lib/data";
import { buildDoseSlots, dueNowSlots, nowInAppTz } from "@/lib/schedule";
import { sendToAll } from "@/lib/push";
import { dogName } from "@/lib/env";
import type { DoseSlot } from "@/lib/types";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const fromQuery = req.nextUrl.searchParams.get("secret");
  const fromHeader = req.headers.get("authorization")?.replace("Bearer ", "");
  return fromQuery === secret || fromHeader === secret;
}

async function run(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = nowInAppTz();
  const windowMinutes = Number(req.nextUrl.searchParams.get("window") ?? 5);

  const [meds, logs, plans] = await Promise.all([
    getMedicationsWithSchedules({ activeOnly: true }),
    getScheduledLogsForDay(now),
    getDailyPlans(now.toISODate()!),
  ]);

  const slots = buildDoseSlots(meds, logs, plans, now);
  const due = dueNowSlots(slots, now, windowMinutes);
  if (due.length === 0) {
    return NextResponse.json({ checked: slots.length, due: 0, sent: 0 });
  }

  const supabase = getSupabase();
  // Which slots have we already notified about today?
  const dayStart = now.startOf("day").toUTC().toISO()!;
  const dayEnd = now.endOf("day").toUTC().toISO()!;
  const { data: already } = await supabase
    .from("notifications_sent")
    .select("medication_id, scheduled_for")
    .gte("scheduled_for", dayStart)
    .lte("scheduled_for", dayEnd);
  const sentKeys = new Set(
    (already ?? []).map(
      (r) => `${r.medication_id}|${DateTime.fromISO(r.scheduled_for).toMillis()}`,
    ),
  );

  // Claim each new slot first (unique constraint dedupes across concurrent runs),
  // so a med is never notified twice. Only slots this run actually claimed get sent.
  const claimed: DoseSlot[] = [];
  for (const slot of due) {
    const key = `${slot.medication.id}|${DateTime.fromISO(slot.scheduledFor).toMillis()}`;
    if (sentKeys.has(key)) continue;
    const { error: claimErr } = await supabase.from("notifications_sent").insert({
      medication_id: slot.medication.id,
      scheduled_for: slot.scheduledFor,
    });
    if (claimErr) continue; // already claimed by a concurrent run
    claimed.push(slot);
  }

  // Group claimed slots by their dose time so meds due together get one push.
  const groups = new Map<string, DoseSlot[]>();
  for (const slot of claimed) {
    const k = DateTime.fromISO(slot.scheduledFor).toMillis().toString();
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(slot);
  }

  let notified = 0;
  for (const [millis, group] of groups) {
    await sendToAll({
      title: "Pawscriptions",
      body: reminderBody(group),
      tag: `due|${millis}`,
      url: "/",
    });
    notified++;
  }

  return NextResponse.json({
    checked: slots.length,
    due: due.length,
    claimed: claimed.length,
    sent: notified,
  });
}

/**
 * Reminder copy that scales with how many meds are due at the same time:
 *  1 → the med (with dose); 2 → "Dog: A and B"; 3+ → "Dog has N meds due".
 */
function reminderBody(group: DoseSlot[]): string {
  const timeLabel = group[0].timeLabel;
  const dog = dogName();
  if (group.length === 1) {
    const s = group[0];
    const dose = s.plannedDose != null ? ` (${s.plannedDose} ${s.medication.unit})` : "";
    return `Time for ${s.medication.name}${dose} — ${timeLabel}`;
  }
  if (group.length === 2) {
    return `${dog}: ${group[0].medication.name} and ${group[1].medication.name} — ${timeLabel}`;
  }
  return `${dog} has ${group.length} meds due — ${timeLabel}`;
}

export async function GET(req: NextRequest) {
  return run(req);
}
export async function POST(req: NextRequest) {
  return run(req);
}
