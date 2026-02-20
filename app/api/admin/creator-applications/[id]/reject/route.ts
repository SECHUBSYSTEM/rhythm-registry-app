import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing application id" }, { status: 400 });
    }

    let reason = "";
    try {
      const body = await request.json();
      reason = typeof body.reason === "string" ? body.reason.trim() : "";
    } catch {
      // no body
    }

    const admin = createAdminClient();
    const { data: app, error: fetchError } = await admin
      .from("creator_applications")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const { error: updateError } = await admin
      .from("creator_applications")
      .update({
        status: "rejected",
        admin_note: reason || "Application did not meet requirements.",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[api/admin/creator-applications/reject]", updateError);
      return NextResponse.json(
        { error: "Failed to reject application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[api/admin/creator-applications/reject]", e);
    return NextResponse.json(
      { error: "Failed to reject application" },
      { status: 500 }
    );
  }
}
