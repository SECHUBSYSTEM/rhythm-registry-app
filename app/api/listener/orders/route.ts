import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import { listOrdersForListener } from "@/lib/orders";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAuth(supabase);
  if ("error" in auth) return auth.error;
  const orders = await listOrdersForListener(supabase, auth.user.id);
  return NextResponse.json(orders);
}
