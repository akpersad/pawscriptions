import { NextResponse } from "next/server";
import { sendToAll } from "@/lib/push";

// Send a test notification to all subscribed devices. Guarded by the passphrase
// middleware (not in the public allowlist), so only logged-in users can hit it.
export async function POST() {
  try {
    const sent = await sendToAll({
      title: "Pawscriptions",
      body: "🐾 Test notification — reminders are working!",
      url: "/",
    });
    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 },
    );
  }
}
