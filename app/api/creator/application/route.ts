import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: row } = await supabase
      .from("creator_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ application: null, status: "not-applied" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    let links: { soundcloud?: string; youtube?: string; other?: string } = {};
    if (row.links) {
      try {
        links = JSON.parse(row.links);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      application: {
        id: row.id,
        userId: row.user_id,
        userName: (profile?.display_name as string) ?? "",
        userEmail: user.email ?? "",
        bio: row.reason ?? "",
        contentType: "both" as const,
        links,
        status: row.status,
        rejectionReason: row.admin_note ?? undefined,
        submittedAt: row.created_at,
        reviewedAt: row.reviewed_at ?? undefined,
      },
      status: row.status,
    });
  } catch (e) {
    console.error("[api/creator/application]", e);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}
