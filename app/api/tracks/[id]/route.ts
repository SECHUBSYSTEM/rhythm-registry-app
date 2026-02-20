import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapDbTrackToTrack, type DbTrackRow } from "@/lib/api-mappers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing track id" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !row) {
      if (error?.code === "PGRST116") {
        return NextResponse.json({ error: "Track not found" }, { status: 404 });
      }
      console.error("[api/tracks/[id]] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch track" },
        { status: 500 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", (row as DbTrackRow).creator_id)
      .single();

    const creatorName =
      (profile?.display_name as string | null) ?? "Unknown";
    const track = mapDbTrackToTrack(row as DbTrackRow, creatorName);

    return NextResponse.json(track);
  } catch (e) {
    console.error("[api/tracks/[id]]", e);
    return NextResponse.json(
      { error: "Failed to fetch track" },
      { status: 500 }
    );
  }
}
