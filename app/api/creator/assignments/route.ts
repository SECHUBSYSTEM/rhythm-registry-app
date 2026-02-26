import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { listAssignmentsForCreator } from "@/lib/orders";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAuth(supabase);
  if ("error" in auth) return auth.error;
  const roleAuth = await requireRole(supabase, auth.user.id, ["creator", "admin"]);
  if ("error" in roleAuth) return roleAuth.error;
  const assignments = await listAssignmentsForCreator(supabase, roleAuth.profile.id);
  return NextResponse.json(assignments);
}
