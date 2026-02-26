import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import { mapDbTrackToTrack, type DbTrackRow } from "@/lib/api-mappers";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase);
    if ("error" in auth) return auth.error;

    const { user, profile } = auth;
    const userId = user.id;
    

    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "1";

    if (mine) {
      const { data: rows, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });
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
      for (const id of creatorIds) nameByCreatorId[id] = "Creator";
      for (const p of profiles ?? []) {
        const display = (p.display_name as string | null)?.trim();
        nameByCreatorId[p.id] = display || "Creator";
      }
      const tracks = trackRows.map((row) =>
        mapDbTrackToTrack(row, nameByCreatorId[row.creator_id] ?? "Creator")
      );
      return NextResponse.json(tracks);
    }

    const { data: creatorTracks } = await supabase
      .from("tracks")
      .select("id")
      .eq("creator_id", userId);
    const creatorTrackIds = (creatorTracks ?? []).map((t: { id: string }) => t.id);
    const { data: accessRows } = await supabase
      .from("user_track_access")
      .select("track_id")
      .eq("user_id", userId);
    const accessTrackIds = (accessRows ?? []).map((r: { track_id: string }) => r.track_id);
    const allIds = [...new Set([...creatorTrackIds, ...accessTrackIds])];
    if (allIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: rows, error } = await supabase
      .from("tracks")
      .select("*")
      .in("id", allIds)
      .order("created_at", { ascending: false });

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
