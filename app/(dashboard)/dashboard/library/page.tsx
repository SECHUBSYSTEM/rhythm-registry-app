"use client";

import { useState, useEffect } from "react";
import { Library, Wifi, WifiOff, Trash2, HardDrive } from "lucide-react";
import { useOfflineTrack } from "@/components/providers/OfflineProvider";
import { useAudioPlayer } from "@/components/providers/AudioPlayerProvider";
import TrackList from "@/components/tracks/TrackList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import { formatFileSize } from "@/lib/mock-data";
import type { Track } from "@/types";

type Tab = "all" | "offline";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { offlineTracks, removeOfflineTrack, totalStorageUsed } =
    useOfflineTrack();
  const { play } = useAudioPlayer();

  const offlineTrackIds = new Set(offlineTracks.map((t) => t.id));

  useEffect(() => {
    api
      .get<Track[]>("/api/tracks")
      .then((res) => setAllTracks(res.data ?? []))
      .catch(() => setAllTracks([]))
      .finally(() => setLoading(false));
  }, []);

  const allTracksWithOffline = allTracks.map((t) => ({
    ...t,
    isOfflineAvailable: offlineTrackIds.has(t.id),
  }));

  return (
    <div className="w-full min-w-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 min-w-0">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: "var(--rose-secondary)",
          }}>
          <Library size={22} style={{ color: "var(--rose-light)" }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-outfit)" }}>
            Your Library
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {offlineTracks.length} downloaded ·{" "}
            {formatFileSize(totalStorageUsed)} used
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex flex-wrap gap-2 mb-6 p-1 rounded-xl w-full min-w-0 sm:w-fit"
        style={{ background: "var(--bg-elevated)" }}>
        <button
          onClick={() => setActiveTab("all")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background:
              activeTab === "all" ? "var(--bg-highlight)" : "transparent",
            color:
              activeTab === "all" ? "var(--text-primary)" : "var(--text-muted)",
          }}>
          <Wifi size={14} />
          All Tracks
        </button>
        <button
          onClick={() => setActiveTab("offline")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background:
              activeTab === "offline" ? "var(--bg-highlight)" : "transparent",
            color:
              activeTab === "offline"
                ? "var(--text-primary)"
                : "var(--text-muted)",
          }}>
          <WifiOff size={14} />
          Offline
          {offlineTracks.length > 0 && (
            <span className="badge badge-success ml-1">
              {offlineTracks.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="w-full min-w-0">
      {activeTab === "all" ? (
        loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <TrackList
            tracks={allTracksWithOffline}
            variant="compact"
            emptyMessage="No tracks in your library yet."
          />
        )
      ) : (
        <div>
          {offlineTracks.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--bg-elevated)" }}>
                <HardDrive size={24} style={{ color: "var(--text-muted)" }} />
              </div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}>
                No offline tracks
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Download tracks from the player to listen offline.
              </p>
            </div>
          ) : (
            <div className="w-full min-w-0 space-y-2 stagger-children">
              {offlineTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-3 rounded-lg group transition-colors"
                  style={{ background: "var(--bg-elevated)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--bg-highlight)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--bg-elevated)";
                  }}>
                  {/* Cover */}
                  <button
                    onClick={() => play(track)}
                    className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, hsl(${(track.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 8) * 45}, 60%, 25%), hsl(${((track.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 8) * 45 + 40) % 360}, 50%, 15%))`,
                    }}>
                    <WifiOff size={14} className="text-white/60" />
                  </button>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}>
                      {track.title}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--text-muted)" }}>
                      {track.creatorName} ·{" "}
                      {formatFileSize(track.encryptedSize)}
                    </p>
                  </div>

                  {/* Offline badge */}
                  <span className="badge badge-success hidden sm:inline-flex">
                    Offline
                  </span>

                  {/* Remove */}
                  <button
                    onClick={() => removeOfflineTrack(track.id)}
                    className="btn-ghost btn-icon opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--text-muted)" }}
                    aria-label="Remove offline track">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
