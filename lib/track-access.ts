import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if the user can access the track (stream or list).
 * Allowed: track creator, admin, or has user_track_access row.
 */
export async function canAccessTrack(
  supabase: SupabaseClient,
  trackId: string,
  userId: string,
  role: string
): Promise<boolean> {
  if (role === "admin") return true;

  const { data: track } = await supabase
    .from("tracks")
    .select("id, creator_id")
    .eq("id", trackId)
    .single();
  if (!track) return false;
  const row = track as { creator_id: string };
  if (row.creator_id === userId) return true;

  const { data: access } = await supabase
    .from("user_track_access")
    .select("id")
    .eq("track_id", trackId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!access;
}
