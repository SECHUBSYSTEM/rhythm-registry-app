import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing track id" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("id, file_path, is_public, creator_id")
      .eq("id", id)
      .single();

    if (trackError || !track) {
      console.error("[api/stream] track fetch error:", trackError?.message ?? "not found", { id });
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const row = track as { file_path: string; is_public: boolean; creator_id: string };
    if (!row.is_public) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== row.creator_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("audio-files")
      .createSignedUrl(row.file_path, 3600);

    if (signError || !signed?.signedUrl) {
      console.error("[api/stream] signed url error:", signError);
      return NextResponse.json(
        { error: "Failed to get stream URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch (e) {
    console.error("[api/stream]", e);
    return NextResponse.json(
      { error: "Failed to get stream URL" },
      { status: 500 }
    );
  }
}
