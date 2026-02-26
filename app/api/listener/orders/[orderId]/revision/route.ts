import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import { submitRevision } from "@/lib/orders";
import { revisionSchema } from "@/lib/validations/checkout";

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
  const parsed = revisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid revision", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { error } = await submitRevision(
    supabase,
    orderId,
    auth.user.id,
    parsed.data.revisionNotes
  );
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
