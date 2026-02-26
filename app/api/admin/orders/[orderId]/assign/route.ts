import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { assignCreatorToOrder } from "@/lib/orders";

const assignBodySchema = { creatorId: (x: unknown) => typeof x === "string" && x.length > 0 };

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
  const roleAuth = await requireRole(supabase, auth.user.id, ["admin"]);
  if ("error" in roleAuth) return roleAuth.error;

  const body = await request.json();
  const creatorId = body?.creatorId;
  if (!assignBodySchema.creatorId(creatorId)) {
    return NextResponse.json(
      { error: "creatorId (profile id) is required" },
      { status: 422 }
    );
  }

  const { error } = await assignCreatorToOrder(supabase, orderId, creatorId);
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
