import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreatorApplication } from "@/types";

export async function GET() {
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

    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from("creator_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/admin/creator-applications]", error);
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json([]);
    }

    const userIds = [...new Set(rows.map((r: { user_id: string }) => r.user_id))];
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const users = usersData?.users ?? [];
    const emailById: Record<string, string> = {};
    for (const u of users) {
      if (u.id && u.email) emailById[u.id] = u.email;
    }

    const nameById: Record<string, string> = {};
    for (const p of profiles ?? []) {
      const row = p as { id: string; display_name: string | null };
      nameById[row.id] = row.display_name ?? "";
    }

    const applications: CreatorApplication[] = rows.map((row: { id: string; user_id: string; status: string; reason: string | null; links: string | null; admin_note: string | null; created_at: string; reviewed_at: string | null }) => {
      let links: { soundcloud?: string; youtube?: string; other?: string } = {};
      if (row.links) {
        try {
          links = JSON.parse(row.links);
        } catch {
          // ignore
        }
      }
      return {
        id: row.id,
        userId: row.user_id,
        userName: nameById[row.user_id] ?? "",
        userEmail: emailById[row.user_id] ?? "",
        bio: row.reason ?? "",
        contentType: "both" as const,
        links,
        status: row.status as CreatorApplication["status"],
        rejectionReason: row.admin_note ?? undefined,
        submittedAt: row.created_at,
        reviewedAt: row.reviewed_at ?? undefined,
      };
    });

    return NextResponse.json(applications);
  } catch (e) {
    console.error("[api/admin/creator-applications]", e);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
