import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapDbTrackToTrack, type DbTrackRow } from "@/lib/api-mappers";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "1";

    let query = supabase
      .from("tracks")
      .select("*")
      .order("created_at", { ascending: false });

    if (mine) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      query = query.eq("creator_id", user.id);
    } else {
      query = query.eq("is_public", true);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("[api/tracks] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch tracks" },
        { status: 500 }
      );
    }

    const trackRows = (rows ?? []) as DbTrackRow[];
    if (trackRows.length === 0) {
      return NextResponse.json([]);
    }

    const creatorIds = [...new Set(trackRows.map((t) => t.creator_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", creatorIds);

    const nameByCreatorId: Record<string, string> = {};
    for (const id of creatorIds) {
      nameByCreatorId[id] = "Creator";
    }
    for (const p of profiles ?? []) {
      const display = (p.display_name as string | null)?.trim();
      nameByCreatorId[p.id] = display || "Creator";
    }

    const tracks = trackRows.map((row) =>
      mapDbTrackToTrack(row, nameByCreatorId[row.creator_id] ?? "Creator")
    );

    return NextResponse.json(tracks);
  } catch (e) {
    console.error("[api/tracks]", e);
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}
