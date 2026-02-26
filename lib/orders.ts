import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListenerOrder, OrderPreferences, PreviewPlaylistItem } from "@/types";

interface DbOrder {
  id: string;
  user_id: string;
  stripe_session_id: string;
  event_type: string;
  event_date: string;
  duration_hours: number;
  vibe_tags: string[] | null;
  rush: boolean;
  status: string;
  assigned_creator_id: string | null;
  total_amount_cents: number;
  rush_fee_cents: number;
  spotify_playlist_url: string | null;
  must_play: string | null;
  do_not_play: string | null;
  special_moments: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapDbOrderToListenerOrder(
  row: DbOrder,
  preferences?: OrderPreferences | null,
  previewPlaylist?: unknown[] | null,
  revisionNotes?: string | null,
  playlistSubmittedAt?: string | null,
  finalTrackId?: string | null,
  stripAmountForCreator?: boolean
): ListenerOrder {
  return {
    id: row.id,
    userId: row.user_id,
    stripeSessionId: row.stripe_session_id,
    eventType: row.event_type,
    eventDate: row.event_date,
    durationHours: row.duration_hours,
    vibeTags: row.vibe_tags,
    rush: row.rush,
    status: row.status as ListenerOrder["status"],
    assignedCreatorId: row.assigned_creator_id,
    totalAmountCents: stripAmountForCreator ? 0 : row.total_amount_cents,
    rushFeeCents: stripAmountForCreator ? 0 : row.rush_fee_cents,
    preferences: preferences ?? undefined,
    previewPlaylist: (previewPlaylist ?? undefined) as PreviewPlaylistItem[] | undefined,
    revisionNotes: revisionNotes ?? undefined,
    playlistSubmittedAt: playlistSubmittedAt ?? undefined,
    finalTrackId: finalTrackId ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get order for listener (owner). Returns null if not found or not owner.
 */
export async function getOrderForListener(
  supabase: SupabaseClient,
  orderId: string,
  userId: string
): Promise<ListenerOrder | null> {
  const { data: order, error } = await supabase
    .from("listener_orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();
  if (error || !order) return null;
  const row = order as DbOrder;

  const { data: playlistRow } = await supabase
    .from("order_playlist")
    .select("playlist_data, revision_notes, submitted_at")
    .eq("order_id", orderId)
    .maybeSingle();

  const playlist = playlistRow as
    | { playlist_data: unknown[]; revision_notes: string | null; submitted_at: string }
    | null;

  const { data: trackRow } = await supabase
    .from("tracks")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  const finalTrackId = trackRow ? (trackRow as { id: string }).id : null;

  const preferences: OrderPreferences | undefined =
    row.spotify_playlist_url ||
    row.must_play ||
    row.do_not_play ||
    row.special_moments ||
    row.notes
      ? {
          spotifyPlaylistUrl: row.spotify_playlist_url ?? undefined,
          mustPlay: row.must_play ?? undefined,
          doNotPlay: row.do_not_play ?? undefined,
          specialMoments: row.special_moments ?? undefined,
          notes: row.notes ?? undefined,
        }
      : undefined;

  return mapDbOrderToListenerOrder(
    row,
    preferences,
    playlist?.playlist_data ?? null,
    playlist?.revision_notes ?? null,
    playlist?.submitted_at ?? null,
    finalTrackId
  );
}

/**
 * List orders for listener (owner). Newest first.
 */
export async function listOrdersForListener(
  supabase: SupabaseClient,
  userId: string
): Promise<ListenerOrder[]> {
  const { data: rows, error } = await supabase
    .from("listener_orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !rows) return [];
  const orders: ListenerOrder[] = [];
  for (const row of rows as DbOrder[]) {
    const preferences: OrderPreferences | undefined =
      row.spotify_playlist_url ||
      row.must_play ||
      row.do_not_play ||
      row.special_moments ||
      row.notes
        ? {
            spotifyPlaylistUrl: row.spotify_playlist_url ?? undefined,
            mustPlay: row.must_play ?? undefined,
            doNotPlay: row.do_not_play ?? undefined,
            specialMoments: row.special_moments ?? undefined,
            notes: row.notes ?? undefined,
          }
        : undefined;
    orders.push(
      mapDbOrderToListenerOrder(row, preferences, null, null, null, undefined)
    );
  }
  return orders;
}

/**
 * Get order by stripe_session_id (for post-checkout redirect).
 */
export async function getOrderBySessionId(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<ListenerOrder | null> {
  const { data: order } = await supabase
    .from("listener_orders")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .eq("user_id", userId)
    .single();
  if (!order) return null;
  return getOrderForListener(supabase, (order as DbOrder).id, userId);
}

/**
 * Get order for creator (assigned). Returns null if not found or not assigned.
 */
export async function getOrderForCreator(
  supabase: SupabaseClient,
  orderId: string,
  profileId: string
): Promise<ListenerOrder | null> {
  const { data: order, error } = await supabase
    .from("listener_orders")
    .select("*")
    .eq("id", orderId)
    .eq("assigned_creator_id", profileId)
    .single();
  if (error || !order) return null;
  const row = order as DbOrder;

  const { data: playlistRow } = await supabase
    .from("order_playlist")
    .select("playlist_data, revision_notes, submitted_at")
    .eq("order_id", orderId)
    .maybeSingle();
  const playlist = playlistRow as
    | { playlist_data: unknown[]; revision_notes: string | null; submitted_at: string }
    | null;

  const preferences: OrderPreferences | undefined =
    row.spotify_playlist_url ||
    row.must_play ||
    row.do_not_play ||
    row.special_moments ||
    row.notes
      ? {
          spotifyPlaylistUrl: row.spotify_playlist_url ?? undefined,
          mustPlay: row.must_play ?? undefined,
          doNotPlay: row.do_not_play ?? undefined,
          specialMoments: row.special_moments ?? undefined,
          notes: row.notes ?? undefined,
        }
      : undefined;

  return mapDbOrderToListenerOrder(
    row,
    preferences,
    playlist?.playlist_data ?? null,
    playlist?.revision_notes ?? null,
    playlist?.submitted_at ?? null,
    undefined,
    true
  );
}

export interface UpdatePreferencesInput {
  spotifyPlaylistUrl?: string;
  mustPlay?: string;
  doNotPlay?: string;
  specialMoments?: string;
  notes?: string;
}

/**
 * Update listener order preferences and set status to PREFERENCES_SUBMITTED. Caller must verify ownership.
 */
export async function updateOrderPreferences(
  supabase: SupabaseClient,
  orderId: string,
  userId: string,
  prefs: UpdatePreferencesInput
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("listener_orders")
    .update({
      spotify_playlist_url: prefs.spotifyPlaylistUrl ?? null,
      must_play: prefs.mustPlay ?? null,
      do_not_play: prefs.doNotPlay ?? null,
      special_moments: prefs.specialMoments ?? null,
      notes: prefs.notes ?? null,
      status: "PREFERENCES_SUBMITTED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("user_id", userId);
  return error ? { error: error.message } : {};
}

/**
 * Submit revision notes. Only when status is PREVIEW_PLAYLIST_READY. Updates order_playlist.revision_notes and order status to REVISION_REQUESTED.
 */
export async function submitRevision(
  supabase: SupabaseClient,
  orderId: string,
  userId: string,
  revisionNotes: string
): Promise<{ error?: string }> {
  const { data: order } = await supabase
    .from("listener_orders")
    .select("id")
    .eq("id", orderId)
    .eq("user_id", userId)
    .eq("status", "PREVIEW_PLAYLIST_READY")
    .single();
  if (!order) return { error: "Order not found or revision not allowed" };

  const { data: existing } = await supabase
    .from("order_playlist")
    .select("playlist_data")
    .eq("order_id", orderId)
    .maybeSingle();
  const playlistData = (existing as { playlist_data?: unknown[] } | null)?.playlist_data ?? [];

  const { error: playlistError } = await supabase
    .from("order_playlist")
    .upsert(
      {
        order_id: orderId,
        revision_notes: revisionNotes,
        playlist_data: playlistData,
      },
      { onConflict: "order_id" }
    );
  if (playlistError) return { error: playlistError.message };

  const { error: orderError } = await supabase
    .from("listener_orders")
    .update({
      status: "REVISION_REQUESTED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("user_id", userId);
  return orderError ? { error: orderError.message } : {};
}

/**
 * Approve playlist: set order status to PLAYLIST_APPROVED. Only when PREVIEW_PLAYLIST_READY.
 */
export async function approvePlaylist(
  supabase: SupabaseClient,
  orderId: string,
  userId: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("listener_orders")
    .update({
      status: "PLAYLIST_APPROVED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("user_id", userId)
    .eq("status", "PREVIEW_PLAYLIST_READY");
  if (error) return { error: error.message };
  return {};
}

/**
 * List orders assigned to creator. Only assigned creator.
 */
export async function listAssignmentsForCreator(
  supabase: SupabaseClient,
  profileId: string
): Promise<ListenerOrder[]> {
  const { data: rows, error } = await supabase
    .from("listener_orders")
    .select("*")
    .eq("assigned_creator_id", profileId)
    .order("created_at", { ascending: false });
  if (error || !rows) return [];
  const orders: ListenerOrder[] = [];
  for (const row of rows as DbOrder[]) {
    const preferences: OrderPreferences | undefined =
      row.spotify_playlist_url ||
      row.must_play ||
      row.do_not_play ||
      row.special_moments ||
      row.notes
        ? {
            spotifyPlaylistUrl: row.spotify_playlist_url ?? undefined,
            mustPlay: row.must_play ?? undefined,
            doNotPlay: row.do_not_play ?? undefined,
            specialMoments: row.special_moments ?? undefined,
            notes: row.notes ?? undefined,
          }
        : undefined;
    orders.push(
      mapDbOrderToListenerOrder(row, preferences, null, null, null, undefined, true)
    );
  }
  return orders;
}

/**
 * Creator accepts assignment: set status to PLAYLIST_PENDING. Allowed only when status is ASSIGNMENT_PENDING (or ASSIGNED for backward compat).
 */
export async function acceptAssignment(
  supabase: SupabaseClient,
  orderId: string,
  profileId: string
): Promise<{ error?: string }> {
  const { data, error } = await supabase
    .from("listener_orders")
    .update({
      status: "PLAYLIST_PENDING",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("assigned_creator_id", profileId)
    .in("status", ["ASSIGNMENT_PENDING", "ASSIGNED"])
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Assignment no longer pending or not found." };
  return {};
}

/**
 * Creator declines: clear assigned_creator_id, set status to AWAITING_ASSIGNMENT. Allowed only when status is ASSIGNMENT_PENDING so admin can reassign.
 */
export async function declineAssignment(
  supabase: SupabaseClient,
  orderId: string,
  profileId: string
): Promise<{ error?: string }> {
  const { data, error } = await supabase
    .from("listener_orders")
    .update({
      assigned_creator_id: null,
      status: "AWAITING_ASSIGNMENT",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("assigned_creator_id", profileId)
    .in("status", ["ASSIGNMENT_PENDING", "ASSIGNED"])
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Assignment cannot be declined (already accepted or not pending)." };
  return {};
}

/**
 * Creator submits preview playlist. Upsert order_playlist, set status to PREVIEW_PLAYLIST_READY.
 * Allowed when status is PLAYLIST_PENDING or REVISION_REQUESTED.
 */
export async function submitCreatorPlaylist(
  supabase: SupabaseClient,
  orderId: string,
  profileId: string,
  playlistData: unknown[]
): Promise<{ error?: string }> {
  const { data: order } = await supabase
    .from("listener_orders")
    .select("id")
    .eq("id", orderId)
    .eq("assigned_creator_id", profileId)
    .in("status", ["PLAYLIST_PENDING", "REVISION_REQUESTED"])
    .single();
  if (!order) return { error: "Order not found or cannot submit playlist" };

  const { error: playlistError } = await supabase
    .from("order_playlist")
    .upsert(
      {
        order_id: orderId,
        playlist_data: playlistData,
        revision_notes: null,
      },
      { onConflict: "order_id" }
    );
  if (playlistError) return { error: playlistError.message };

  const { error: orderError } = await supabase
    .from("listener_orders")
    .update({
      status: "PREVIEW_PLAYLIST_READY",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("assigned_creator_id", profileId);
  return orderError ? { error: orderError.message } : {};
}

/**
 * List all orders (admin). RLS must allow admin to select all.
 */
export async function listAllOrders(
  supabase: SupabaseClient
): Promise<ListenerOrder[]> {
  const { data: rows, error } = await supabase
    .from("listener_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !rows) return [];
  const orders: ListenerOrder[] = [];
  for (const row of rows as DbOrder[]) {
    const preferences: OrderPreferences | undefined =
      row.spotify_playlist_url ||
      row.must_play ||
      row.do_not_play ||
      row.special_moments ||
      row.notes
        ? {
            spotifyPlaylistUrl: row.spotify_playlist_url ?? undefined,
            mustPlay: row.must_play ?? undefined,
            doNotPlay: row.do_not_play ?? undefined,
            specialMoments: row.special_moments ?? undefined,
            notes: row.notes ?? undefined,
          }
        : undefined;
    orders.push(
      mapDbOrderToListenerOrder(row, preferences, null, null, null, undefined)
    );
  }
  return orders;
}

/**
 * Assign or reassign creator to order. Sets assigned_creator_id and status to ASSIGNMENT_PENDING (waiting for creator to accept). Admin only.
 */
export async function assignCreatorToOrder(
  supabase: SupabaseClient,
  orderId: string,
  creatorId: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("listener_orders")
    .update({
      assigned_creator_id: creatorId,
      status: "ASSIGNMENT_PENDING",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) return { error: error.message };
  return {};
}
