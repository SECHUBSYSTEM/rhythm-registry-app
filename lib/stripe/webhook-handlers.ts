import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Handle checkout.session.completed. Idempotent by stripe_session_id.
 * Creates listener_orders and sets listener_access_granted_at on profile.
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const supabase = createAdminClient();

  // Idempotency: if order already exists for this session, skip
  const { data: existing } = await supabase
    .from("listener_orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return;

  const userId = session.metadata?.userId as string | undefined;
  if (!userId) {
    throw new Error("Checkout session missing metadata.userId");
  }

  const eventType = (session.metadata?.eventType as string) ?? "";
  const eventDate = (session.metadata?.eventDate as string) ?? "";
  const durationHours = parseInt(
    (session.metadata?.durationHours as string) ?? "1",
    10
  );
  const vibeTagsRaw = session.metadata?.vibeTags as string | undefined;
  const vibeTags: string[] = vibeTagsRaw
    ? (typeof vibeTagsRaw === "string" ? JSON.parse(vibeTagsRaw) : vibeTagsRaw)
    : [];
  const rush = session.metadata?.rush === "true";
  const totalAmountCents = parseInt(
    (session.metadata?.totalAmountCents as string) ?? "0",
    10
  );
  const rushFeeCents = parseInt(
    (session.metadata?.rushFeeCents as string) ?? "0",
    10
  );

  const { error: orderError } = await supabase.from("listener_orders").insert({
    user_id: userId,
    stripe_session_id: session.id,
    event_type: eventType,
    event_date: eventDate,
    duration_hours: durationHours,
    vibe_tags: vibeTags.length ? vibeTags : null,
    rush,
    status: "AWAITING_ASSIGNMENT",
    total_amount_cents: totalAmountCents,
    rush_fee_cents: rushFeeCents,
  });

  if (orderError) {
    throw new Error(
      `Failed to create listener order: ${orderError.message}`
    );
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      listener_access_granted_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(
      `Failed to set listener_access_granted_at: ${profileError.message}`
    );
  }
}
