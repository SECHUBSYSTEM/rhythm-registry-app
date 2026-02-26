import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { acceptAssignment } from "@/lib/orders";

export async function POST(
  _request: NextRequest,
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
  const { error } = await acceptAssignment(supabase, orderId, roleAuth.profile.id);
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
