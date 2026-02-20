import { createClient } from "@supabase/supabase-js";

/**
 * Server-only. Use for admin operations that need service role (e.g. listing users, bypassing RLS).
 * Only call after verifying the current user is admin via the regular server client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
