"use client";

import { Play, Pause, Download, Clock } from "lucide-react";
import { useAudioPlayer } from "@/components/providers/AudioPlayerProvider";
import { formatDuration } from "@/lib/mock-data";
import type { Track } from "@/types";

interface TrackCardProps {
  track: Track;
  variant?: "grid" | "compact";
  showCreator?: boolean;
}

// Deterministic colour based on track id for cover placeholder
function getCoverGradient(id: string): string {
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hues = [340, 280, 220, 190, 160, 30, 0, 260];
  const hue = hues[hash % hues.length];
  return `linear-gradient(135deg, hsl(${hue}, 60%, 25%), hsl(${(hue + 40) % 360}, 50%, 15%))`;
}

export default function TrackCard({
  track,
  variant = "grid",
  showCreator = true,
}: TrackCardProps) {
  const { currentTrack, isPlaying, play, pause, resume } = useAudioPlayer();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handlePlayToggle = () => {
    if (isCurrentlyPlaying) {
      pause();
    } else if (isCurrentTrack) {
      resume();
    } else {
      play(track);
    }
  };

  if (variant === "compact") {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-lg group cursor-pointer transition-all duration-200"
        style={{
          background: isCurrentTrack ? "var(--bg-highlight)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!isCurrentTrack)
            (e.currentTarget as HTMLElement).style.background =
              "var(--bg-elevated)";
        }}
        onMouseLeave={(e) => {
          if (!isCurrentTrack)
            (e.currentTarget as HTMLElement).style.background = "transparent";
        }}>
        {/* Cover */}
        <div
          className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0"
          style={{ background: getCoverGradient(track.id) }}>
          <button
            onClick={handlePlayToggle}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.5)" }}
            aria-label={isCurrentlyPlaying ? "Pause" : "Play"}>
            {isCurrentlyPlaying ? (
              <Pause size={16} className="text-white" fill="white" />
            ) : (
              <Play size={16} className="text-white" fill="white" />
            )}
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{
              color: isCurrentTrack
                ? "var(--rose-light)"
                : "var(--text-primary)",
            }}>
            {track.title}
          </p>
          {showCreator && (
            <p
              className="text-xs truncate"
              style={{ color: "var(--text-muted)" }}>
              {track.creatorName}
            </p>
          )}
        </div>

        {/* Duration */}
        <span
          className="text-xs tabular-nums shrink-0"
          style={{ color: "var(--text-muted)" }}>
          {formatDuration(track.duration)}
        </span>
      </div>
    );
  }

  // Grid variant
  return (
    <div className="glass-card p-3 group animate-fade-in-up min-w-0">
      {/* Cover art placeholder */}
      <div
        className="relative aspect-square rounded-lg overflow-hidden mb-3"
        style={{ background: getCoverGradient(track.id) }}>
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 60%)",
          }}
        />

        {/* Play button overlay */}
        <button
          onClick={handlePlayToggle}
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
          style={{
            background: "var(--rose-primary)",
            boxShadow: "var(--shadow-lg)",
          }}
          aria-label={isCurrentlyPlaying ? "Pause" : "Play"}>
          {isCurrentlyPlaying ? (
            <Pause size={18} className="text-white" fill="white" />
          ) : (
            <Play size={18} className="text-white ml-0.5" fill="white" />
          )}
        </button>

        {/* Offline badge */}
        {track.isOfflineAvailable && (
          <div
            className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(29, 185, 84, 0.9)",
            }}>
            <Download size={12} className="text-white" />
          </div>
        )}
      </div>

      {/* Track info */}
      <h3
        className="text-sm font-semibold truncate mb-0.5"
        style={{
          color: isCurrentTrack ? "var(--rose-light)" : "var(--text-primary)",
          fontFamily: "var(--font-inter)",
        }}>
        {track.title}
      </h3>

      {showCreator && (
        <p
          className="text-xs truncate mb-2"
          style={{ color: "var(--text-muted)" }}>
          {track.creatorName}
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <Clock size={11} style={{ color: "var(--text-disabled)" }} />
        <span
          className="text-xs tabular-nums"
          style={{ color: "var(--text-disabled)" }}>
          {formatDuration(track.duration)}
        </span>
      </div>
    </div>
  );
}

export function TrackCardSkeleton({
  variant = "grid",
}: {
  variant?: "grid" | "compact";
}) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-transparent">
        <div className="w-12 h-12 rounded-lg shrink-0 skeleton" />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="h-3 w-3/4 rounded-full skeleton" />
          <div className="h-2 w-1/2 rounded-full skeleton" />
        </div>
        <div className="w-8 h-2 rounded-full skeleton shrink-0" />
      </div>
    );
  }

  return (
    <div className="glass-card p-3">
      <div className="aspect-square rounded-lg mb-3 skeleton" />
      <div className="h-3 w-3/4 rounded-full mb-2 skeleton" />
      <div className="h-2 w-1/2 rounded-full mb-3 skeleton" />
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full skeleton" />
        <div className="w-8 h-2 rounded-full skeleton" />
      </div>
    </div>
  );
}
