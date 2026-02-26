import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import { updateOrderPreferences } from "@/lib/orders";
import { orderPreferencesSchema } from "@/lib/validations/checkout";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }
  const supabase = await createClient();
  const auth = await requireAuth(supabase);
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = orderPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid preferences", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { error } = await updateOrderPreferences(
    supabase,
    orderId,
    auth.user.id,
    parsed.data
  );
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
