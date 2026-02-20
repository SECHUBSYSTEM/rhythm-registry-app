import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ allowed: false }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get("trackId");
    const deviceFingerprintHash = searchParams.get("deviceFingerprintHash");

    if (!trackId || !deviceFingerprintHash) {
      return NextResponse.json({ allowed: false }, { status: 200 });
    }

    const { data, error } = await supabase
      .from("offline_downloads")
      .select("id")
      .eq("user_id", user.id)
      .eq("track_id", trackId)
      .eq("device_fingerprint_hash", deviceFingerprintHash)
      .maybeSingle();

    if (error) {
      console.error("[api/offline/validate]", error);
      return NextResponse.json({ allowed: false }, { status: 200 });
    }

    return NextResponse.json({ allowed: !!data });
  } catch (e) {
    console.error("[api/offline/validate]", e);
    return NextResponse.json({ allowed: false }, { status: 200 });
  }
}
