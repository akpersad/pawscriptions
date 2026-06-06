import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

let client: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service-role key. Never import this from
 * a Client Component — the service role bypasses RLS and must never reach the browser.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return client;
}
