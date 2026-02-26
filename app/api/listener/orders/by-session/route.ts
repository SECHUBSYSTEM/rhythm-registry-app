import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import { getOrderBySessionId } from "@/lib/orders";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId?.trim()) {
    return NextResponse.json(
      { error: "session_id is required" },
      { status: 400 }
    );
  }
  const supabase = await createClient();
  const auth = await requireAuth(supabase);
  if ("error" in auth) return auth.error;
  const order = await getOrderBySessionId(supabase, sessionId.trim(), auth.user.id);
  if (!order) {
    return NextResponse.json({ order: null }, { status: 200 });
  }
  return NextResponse.json({ order });
}
