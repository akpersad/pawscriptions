import "server-only";
import webpush from "web-push";
import { getSupabase } from "./supabase";
import { requireEnv } from "./env";

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    requireEnv("VAPID_PUBLIC_KEY"),
    requireEnv("VAPID_PRIVATE_KEY"),
  );
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

interface SubRow {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Send a payload to every stored subscription, pruning ones that are gone. */
export async function sendToAll(payload: PushPayload): Promise<number> {
  configure();
  const supabase = getSupabase();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, keys");
  if (error) throw error;

  let sent = 0;
  const stale: string[] = [];
  await Promise.all(
    (subs ?? []).map(async (s: SubRow) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys },
          JSON.stringify(payload),
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) stale.push(s.id);
      }
    }),
  );
  if (stale.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", stale);
  }
  return sent;
}
