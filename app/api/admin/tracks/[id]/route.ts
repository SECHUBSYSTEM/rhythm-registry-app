import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, requireRole } from "@/lib/api-auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: trackId } = await params;
  if (!trackId) {
    return NextResponse.json({ error: "Track ID required" }, { status: 400 });
  }
  const supabase = await createClient();
  const auth = await requireAuth(supabase);
  if ("error" in auth) return auth.error;
  const roleAuth = await requireRole(supabase, auth.user.id, ["admin"]);
  if ("error" in roleAuth) return roleAuth.error;

  const admin = createAdminClient();
  const { data: track, error: fetchError } = await admin
    .from("tracks")
    .select("file_path")
    .eq("id", trackId)
    .single();

  if (fetchError || !track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  const filePath = (track as { file_path: string }).file_path;
  if (filePath) {
    await admin.storage.from("audio-files").remove([filePath]);
  }

  const { error: deleteError } = await admin.from("tracks").delete().eq("id", trackId);
  if (deleteError) {
    console.error("[admin/tracks] delete error:", deleteError);
    return NextResponse.json({ error: "Failed to delete track" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
