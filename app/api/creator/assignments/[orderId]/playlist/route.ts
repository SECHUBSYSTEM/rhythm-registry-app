import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { submitCreatorPlaylist } from "@/lib/orders";
import { playlistSubmitSchema } from "@/lib/validations/checkout";

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
  const roleAuth = await requireRole(supabase, auth.user.id, ["creator", "admin"]);
  if ("error" in roleAuth) return roleAuth.error;

  const body = await request.json();
  const parsed = playlistSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid playlist", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { error } = await submitCreatorPlaylist(
    supabase,
    orderId,
    roleAuth.profile.id,
    parsed.data.playlistData ?? []
  );
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
