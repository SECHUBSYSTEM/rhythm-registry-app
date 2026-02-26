import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import { checkoutFormSchema } from "@/lib/validations/checkout";
import { calculateCheckoutAmount } from "@/lib/stripe/pricing";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, {
    apiVersion: "2025-06-30.basil" as Stripe.LatestApiVersion,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase);
    if ("error" in auth) return auth.error;

    const { user } = auth;
    const signupRole = user.user_metadata?.signup_role as string | undefined;
    if (signupRole !== "listener") {
      return NextResponse.json(
        { error: "Checkout is only for listeners" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = checkoutFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const { eventType, eventDate, durationHours, vibeTags, rush, email } =
      parsed.data;

    const {
      totalAmountCents,
      rushFeeCents,
      baseAmountCents,
      platformFeeCents,
      creatorPayoutCents,
    } = calculateCheckoutAmount(durationHours, rush);

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl?.origin ||
      "http://localhost:3000";
    const successUrl = `${origin}/dashboard/orders?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/dashboard/onboarding`;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: totalAmountCents,
            product_data: {
              name: `Custom mix — ${eventType}`,
              description: `${eventDate}, ${durationHours}h${rush ? " (rush)" : ""}. Vibes: ${(vibeTags ?? []).join(", ")}`,
            },
          },
        },
      ],
      metadata: {
        userId: user.id,
        userEmail: email,
        eventType,
        eventDate,
        durationHours: String(durationHours),
        vibeTags: JSON.stringify(vibeTags ?? []),
        rush: String(rush),
        totalAmountCents: String(totalAmountCents),
        rushFeeCents: String(rushFeeCents),
        baseAmountCents: String(baseAmountCents),
        platformFeeCents: String(platformFeeCents),
        creatorPayoutCents: String(creatorPayoutCents),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[api/checkout]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 },
    );
  }
}
