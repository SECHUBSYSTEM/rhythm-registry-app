import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    const links = body.links ?? {};

    if (!bio) {
      return NextResponse.json(
        { error: "Bio / reason is required" },
        { status: 400 }
      );
    }

    const linksStr =
      typeof links === "object"
        ? JSON.stringify({
            soundcloud: links.soundcloud ?? "",
            youtube: links.youtube ?? "",
            other: links.other ?? "",
          })
        : "";

    const { data: existing } = await supabase
      .from("creator_applications")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending application" },
        { status: 409 }
      );
    }

    const { data: row, error } = await supabase
      .from("creator_applications")
      .insert({
        user_id: user.id,
        status: "pending",
        reason: bio,
        links: linksStr || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[api/creator/apply]", error);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: row.id,
        status: row.status,
        submittedAt: row.created_at,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("[api/creator/apply]", e);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
