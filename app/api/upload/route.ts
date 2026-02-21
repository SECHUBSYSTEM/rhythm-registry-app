import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapDbTrackToTrack, type DbTrackRow } from "@/lib/api-mappers";
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

export async function POST(request: NextRequest) {
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
      .select("role, display_name")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      (profile.role !== "creator" && profile.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Creator or admin access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string)?.trim() ?? "";
    const description = (formData.get("description") as string)?.trim() || null;

    if (!file || !title) {
      return NextResponse.json(
        { error: "File and title are required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 200 MB)" },
        { status: 400 }
      );
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
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    let durationSeconds: number | null = null;
    try {
      const buffer = await file.arrayBuffer();
      const metadata = await parseBuffer(new Uint8Array(buffer));
      if (
        metadata.format.duration != null &&
        Number.isFinite(metadata.format.duration)
      ) {
        durationSeconds = Math.round(metadata.format.duration);
      }
    } catch (metaErr) {
      console.warn("[api/upload] Could not extract duration:", metaErr);
    }

    const { error: uploadError } = await supabase.storage
      .from("audio-files")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[api/upload] storage error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    const { data: row, error: insertError } = await supabase
      .from("tracks")
      .insert({
        creator_id: user.id,
        title,
        description: description || null,
        file_path: path,
        file_size: file.size,
        format: ext,
        duration: durationSeconds,
        is_public: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[api/upload] insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save track" },
        { status: 500 }
      );
    }

    const creatorName =
      (profile.display_name as string)?.trim() ||
      (user.email ?? "Creator");
    const track = mapDbTrackToTrack(row as DbTrackRow, creatorName);

    return NextResponse.json(track, { status: 201 });
  } catch (e) {
    console.error("[api/upload]", e);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
