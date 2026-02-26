import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/api-auth";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAuth(supabase);
  if ("error" in auth) return auth.error;
  const roleAuth = await requireRole(supabase, auth.user.id, ["admin"]);
  if ("error" in roleAuth) return roleAuth.error;

  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("role", "creator")
    .order("display_name");
  if (error) {
    return NextResponse.json({ error: "Failed to fetch creators" }, { status: 500 });
  }
  const creators = (rows ?? []).map((r: { id: string; display_name: string | null }) => ({
    id: r.id,
    displayName: (r.display_name ?? "").trim() || "Creator",
  }));
  return NextResponse.json(creators);
}
