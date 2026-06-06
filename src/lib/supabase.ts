import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

/**
 * The dedicated Postgres schema all Pawscriptions tables live in.
 *
 * This Supabase project is SHARED with another app, which uses the default
 * `public` schema. Pinning the client to its own schema means every `.from()`
 * call resolves inside `pawscriptions` and the app can never read or write the
 * other app's tables — they aren't even addressable through this client.
 *
 * Requires `pawscriptions` to be added to Supabase → Settings → API → Exposed
 * schemas, and matches the schema created in supabase/schema.sql.
 */
const DB_SCHEMA = "pawscriptions";

function createSupabase() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: DB_SCHEMA },
    },
  );
}

// Inferred so the pinned schema (not the default "public") flows into the type.
let client: ReturnType<typeof createSupabase> | null = null;

/**
 * Server-only Supabase client using the service-role key, pinned to the
 * `pawscriptions` schema. Never import this from a Client Component — the
 * service role bypasses RLS and must never reach the browser.
 */
export function getSupabase() {
  if (!client) {
    client = createSupabase();
  }
  return client;
}
