import type { Track } from "@/types";

export interface DbTrackRow {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  file_path: string;
  hls_path: string | null;
  duration: number | null;
  format: string | null;
  bitrate: number | null;
  file_size: number | null;
  tags: string[] | null;
  album_art_path: string | null;
  is_public: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Map DB track row + creator display name to frontend Track (camelCase).
 */
export function mapDbTrackToTrack(
  row: DbTrackRow,
  creatorName: string
): Track {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    creatorId: row.creator_id,
    creatorName: creatorName || "Unknown",
    coverUrl: row.album_art_path ?? undefined,
    duration: row.duration ?? 0,
    fileSize: row.file_size ?? 0,
    createdAt: row.created_at,
    isOfflineAvailable: false,
  };
}
