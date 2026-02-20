import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapDbTrackToTrack, type DbTrackRow } from "@/lib/api-mappers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (!q) {
      return NextResponse.json({
        tracks: [],
        total: 0,
        query: "",
      });
    }

    const supabase = await createClient();
    const pattern = `%${q}%`;

    // Search tracks by title/description; get creator names via profiles
    const { data: rows, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("is_public", true)
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/search] Supabase error:", error);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }

    const trackRows = (rows ?? []) as DbTrackRow[];
    if (trackRows.length === 0) {
      return NextResponse.json({
        tracks: [],
        total: 0,
        query: q,
      });
    }

    const creatorIds = [...new Set(trackRows.map((t) => t.creator_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", creatorIds);

    const nameByCreatorId: Record<string, string> = {};
    for (const p of profiles ?? []) {
      nameByCreatorId[p.id] = p.display_name ?? "Unknown";
    }

    let tracks = trackRows.map((row) =>
      mapDbTrackToTrack(row, nameByCreatorId[row.creator_id] ?? "Unknown")
    );

    // Client-side filter by creatorName (DB doesn't have it in tracks)
    const lower = q.toLowerCase();
    tracks = tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        t.creatorName.toLowerCase().includes(lower) ||
        (t.description?.toLowerCase().includes(lower) ?? false)
    );

    return NextResponse.json({
      tracks,
      total: tracks.length,
      query: q,
    });
  } catch (e) {
    console.error("[api/search]", e);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
