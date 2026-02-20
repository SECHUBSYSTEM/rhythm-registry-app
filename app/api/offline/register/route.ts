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
    const trackId = body.trackId ?? body.track_id;
    const deviceFingerprintHash =
      body.deviceFingerprintHash ?? body.device_fingerprint_hash;

    if (!trackId || !deviceFingerprintHash) {
      return NextResponse.json(
        { error: "trackId and deviceFingerprintHash required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("offline_downloads").upsert(
      {
        user_id: user.id,
        track_id: trackId,
        device_fingerprint_hash: deviceFingerprintHash,
      },
      { onConflict: "user_id,track_id,device_fingerprint_hash" }
    );

    if (error) {
      console.error("[api/offline/register]", error);
      return NextResponse.json(
        { error: "Failed to register offline download" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[api/offline/register]", e);
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    );
  }
}
