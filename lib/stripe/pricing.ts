/**
 * Single source for checkout pricing.
 *
 * Base prices are per booking (not per hour) and tiered by duration:
 *  - 2 hours →  $380
 *  - 3 hours →  $540
 *  - 4 hours →  $640
 *  - 5 hours →  $700
 *  - 6 hours →  $720
 *
 * Rush fee: +$200 flat.
 */

export const BASE_PRICES_CENTS: Record<number, number> = {
  2: 38000,
  3: 54000,
  4: 64000,
  5: 70000,
  6: 72000,
};

export const RUSH_FEE_CENTS = 20000; // $200.00

export interface CheckoutAmount {
  /**
   * Total that the listener pays (what we charge in Stripe).
   */
  totalAmountCents: number;
  /**
   * Portion of the total that is the rush surcharge.
   */
  rushFeeCents: number;
  /**
   * Base package price before rush.
   */
  baseAmountCents: number;
  /**
   * Our 30% platform fee, taken from the total.
   */
  platformFeeCents: number;
  /**
   * Net payout earmarked for the creator (70% of total).
   */
  creatorPayoutCents: number;
}

/**
 * Calculate total price, rush fee, and split between platform and creator.
 */
export function calculateCheckoutAmount(
  durationHours: number,
  rush: boolean,
): CheckoutAmount {
  const baseAmountCents =
    BASE_PRICES_CENTS[durationHours] ?? BASE_PRICES_CENTS[2];
  const rushFeeCents = rush ? RUSH_FEE_CENTS : 0;
  const totalAmountCents = baseAmountCents + rushFeeCents;
  const platformFeeCents = Math.round(totalAmountCents * 0.3);
  const creatorPayoutCents = totalAmountCents - platformFeeCents;

  return {
    totalAmountCents,
    rushFeeCents,
    baseAmountCents,
    platformFeeCents,
    creatorPayoutCents,
  };
}
