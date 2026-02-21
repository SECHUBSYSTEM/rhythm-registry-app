import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const nextPath = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    // After email verification: ensure profile has display_name from signup metadata
    if (data?.user) {
      const displayName =
        (data.user.user_metadata?.display_name as string)?.trim();
      if (displayName) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", data.user.id)
          .single();
        const current = (profile as { display_name?: string | null } | null)
          ?.display_name;
        if (current == null || current === "") {
          await supabase
            .from("profiles")
            .update({
              display_name: displayName,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.user.id);
        }
      }
    }
  }

  const origin = request.nextUrl.origin;
  const safeNext =
    nextPath &&
    nextPath.startsWith("/") &&
    !nextPath.startsWith("//") &&
    !nextPath.includes("http");
  const redirectTo = safeNext ? `${origin}${nextPath}` : `${origin}/dashboard`;

  return NextResponse.redirect(redirectTo);
}
