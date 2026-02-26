import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { listAllOrders } from "@/lib/orders";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAuth(supabase);
  if ("error" in auth) return auth.error;
  const roleAuth = await requireRole(supabase, auth.user.id, ["admin"]);
  if ("error" in roleAuth) return roleAuth.error;
  const orders = await listAllOrders(supabase);
  return NextResponse.json(orders);
}
