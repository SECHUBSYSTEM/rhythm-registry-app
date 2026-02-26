import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { getOrderForCreator } from "@/lib/orders";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }
  const supabase = await createClient();
  const auth = await requireAuth(supabase);
  if ("error" in auth) return auth.error;
  const roleAuth = await requireRole(supabase, auth.user.id, ["creator", "admin"]);
  if ("error" in roleAuth) return roleAuth.error;
  const order = await getOrderForCreator(supabase, orderId, roleAuth.profile.id);
  if (!order) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  return NextResponse.json(order);
}
