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

    const admin = createAdminClient();
    const { data: app, error: fetchError } = await admin
      .from("creator_applications")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const applicantId = (app as { user_id: string }).user_id;

    const { error: updateAppError } = await admin
      .from("creator_applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", id);

    if (updateAppError) {
      console.error("[approve]", updateAppError);
      return NextResponse.json(
        { error: "Failed to approve application" },
        { status: 500 }
      );
    }

    await admin
      .from("profiles")
      .update({ role: "creator", updated_at: new Date().toISOString() })
      .eq("id", applicantId);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[api/admin/creator-applications/approve]", e);
    return NextResponse.json(
      { error: "Failed to approve application" },
      { status: 500 }
    );
  }
}
