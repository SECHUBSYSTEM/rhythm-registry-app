import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { getOrderForCreator } from "@/lib/orders";
import { parseBuffer } from "music-metadata";

const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB
const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/aac",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireAuth(supabase);
  if ("error" in auth) return auth.error;
  const roleAuth = await requireRole(supabase, auth.user.id, ["creator", "admin"]);
  if ("error" in roleAuth) return roleAuth.error;

  const order = await getOrderForCreator(supabase, orderId, roleAuth.profile.id);
  if (!order) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  if (order.status !== "PLAYLIST_APPROVED") {
    return NextResponse.json(
      { error: "Order must be in PLAYLIST_APPROVED to deliver final mix" },
      { status: 400 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Request body too large or invalid. Max 200 MB." },
      { status: 413 }
    );
  }
  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string)?.trim() ?? order.eventType + " — Final Mix";
  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large (max 200 MB)" }, { status: 400 });
  }
  const okType =
    ALLOWED_TYPES.includes(file.type) ||
    /\.(mp3|wav|flac|aac|ogg|m4a)$/i.test(file.name);
  if (!okType) {
    return NextResponse.json(
      { error: "Invalid file format. Use MP3, WAV, FLAC, AAC, OGG, or M4A." },
      { status: 400 }
    );
  }

  const ext = file.name.replace(/^.*\./, "").toLowerCase() || "mp3";
  const filePath = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;

  let durationSeconds: number | null = null;
  try {
    const buffer = await file.arrayBuffer();
    const metadata = await parseBuffer(
      new Uint8Array(buffer),
      file.type || undefined
    );
    if (
      metadata.format.duration != null &&
      Number.isFinite(metadata.format.duration)
    ) {
      durationSeconds = Math.round(metadata.format.duration);
    }
  } catch {
    // ignore
  }

  const { error: uploadError } = await supabase.storage
    .from("audio-files")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    console.error("[final-mix] storage error:", uploadError);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }

  const { data: trackRow, error: insertError } = await supabase
    .from("tracks")
    .insert({
      creator_id: auth.user.id,
      order_id: orderId,
      title,
      description: `Final mix for ${order.eventType} — ${order.eventDate}`,
      file_path: filePath,
      file_size: file.size,
      format: ext,
      duration: durationSeconds,
      is_public: false,
    })
    .select("id")
    .single();

  if (insertError || !trackRow) {
    console.error("[final-mix] track insert error:", insertError);
    return NextResponse.json({ error: "Failed to save track" }, { status: 500 });
  }

  const trackId = (trackRow as { id: string }).id;
  const admin = createAdminClient();

  const { error: accessError } = await admin.from("user_track_access").insert({
    user_id: order.userId,
    track_id: trackId,
    source: "order_mix",
    order_id: orderId,
  });
  if (accessError) {
    console.error("[final-mix] user_track_access error:", accessError);
    return NextResponse.json({ error: "Failed to grant access" }, { status: 500 });
  }

  const { error: orderError } = await admin
    .from("listener_orders")
    .update({
      status: "PAYOUT_ELIGIBLE",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (orderError) {
    console.error("[final-mix] order update error:", orderError);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, trackId }, { status: 201 });
}
