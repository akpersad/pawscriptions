import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Save (or refresh) a push subscription for this device.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.endpoint || !body?.keys) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  const supabase = getSupabase();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: body.endpoint,
      keys: body.keys,
      label: body.label ?? null,
    },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Remove a subscription (disable reminders on this device).
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }
  const supabase = getSupabase();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
