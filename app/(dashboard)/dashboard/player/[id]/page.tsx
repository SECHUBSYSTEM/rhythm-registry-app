"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  Share2,
  Clock,
  HardDrive,
  CheckCircle2,
} from "lucide-react";
import { useAudioPlayer } from "@/components/providers/AudioPlayerProvider";
import Waveform from "@/components/audio/Waveform";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import { formatDuration, formatFileSize } from "@/lib/format";
import type { Track } from "@/types";
import { useOfflineTrack } from "@/components/providers/OfflineProvider";

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    play,
    pause,
    resume,
    seek,
    next,
    previous,
  } = useAudioPlayer();
  const { isTrackOffline, downloadTrack, isDownloading, downloadProgress } =
    useOfflineTrack();

  useEffect(() => {
    let cancelled = false;
    api
      .get<Track>(`/api/tracks/${id}`)
      .then((res) => {
        if (!cancelled) setTrack(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.status === 404 ? "Track not found." : "Failed to load track.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" label="Loading track..." />
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="text-text-muted">{error ?? "Track not found."}</p>
        <Link href="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }
  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
  const offline = isTrackOffline(track.id);

  const handlePlay = () => {
    if (isCurrentlyPlaying) {
      pause();
    } else if (isCurrentTrack) {
      resume();
    } else {
      play(track);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    seek(Math.max(0, Math.min(100, percent)));
  };

  const hash = track.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hues = [340, 280, 220, 190, 160, 30, 0, 260];
  const hue = hues[hash % hues.length];
  const coverGradient = `linear-gradient(135deg, hsl(${hue}, 60%, 25%), hsl(${(hue + 40) % 360}, 50%, 15%))`;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors"
        style={{ color: "var(--text-muted)", textDecoration: "none" }}>
        <ArrowLeft size={16} />
        Back
      </Link>

      {/* Cover artwork */}
      <div
        className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden mb-8"
        style={{
          background: coverGradient,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${`hsl(${hue}, 40%, 15%)`}`,
        }}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 75%, rgba(255,255,255,0.15) 0%, transparent 50%)",
          }}
        />
        {isCurrentlyPlaying && (
          <div className="absolute bottom-4 left-4 right-4">
            <Waveform isPlaying barCount={30} height={40} />
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="text-center mb-6">
        <h1
          className="text-xl md:text-2xl font-bold mb-1"
          style={{ fontFamily: "var(--font-outfit)" }}>
          {track.title}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {track.creatorName}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div
          className="progress-bar"
          onClick={handleSeek}
          style={{ height: "5px" }}>
          <div
            className="progress-bar-fill"
            style={{ width: `${isCurrentTrack ? progress : 0}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span
            className="text-[0.6875rem] tabular-nums"
            style={{ color: "var(--text-muted)" }}>
            {formatDuration(isCurrentTrack ? Math.round(currentTime) : 0)}
          </span>
          <span
            className="text-[0.6875rem] tabular-nums"
            style={{ color: "var(--text-muted)" }}>
            {formatDuration(track.duration)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <button
          onClick={previous}
          className="btn-ghost btn-icon"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Previous">
          <SkipBack size={24} fill="currentColor" />
        </button>

        <button
          onClick={handlePlay}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105"
          style={{ background: "white" }}
          aria-label={isCurrentlyPlaying ? "Pause" : "Play"}>
          {isCurrentlyPlaying ? (
            <Pause size={28} fill="black" className="text-black" />
          ) : (
            <Play size={28} fill="black" className="text-black ml-1" />
          )}
        </button>

        <button
          onClick={next}
          className="btn-ghost btn-icon"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Next">
          <SkipForward size={24} fill="currentColor" />
        </button>
      </div>

      {/* Waveform visualisation */}
      <div
        className="glass-card-static p-6 mb-6"
        style={{ borderRadius: "var(--radius-xl)" }}>
        <p
          className="text-xs font-medium mb-3 uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}>
          Waveform
        </p>
        <Waveform isPlaying={isCurrentlyPlaying} barCount={60} height={80} />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Download for offline */}
        <button
          onClick={() => !offline && downloadTrack(track)}
          disabled={offline || isDownloading === track.id}
          className="btn btn-outline flex-1"
          style={{
            opacity: offline ? 0.6 : 1,
            borderColor: offline ? "var(--success)" : "var(--border-strong)",
            color: offline ? "var(--success)" : "var(--text-primary)",
          }}>
          {offline ? (
            <>
              <CheckCircle2 size={16} />
              Downloaded
            </>
          ) : isDownloading === track.id ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
              Downloading {downloadProgress}%
            </>
          ) : (
            <>
              <Download size={16} />
              Download for offline
            </>
          )}
        </button>

        {/* Share */}
        <button className="btn btn-outline flex-1">
          <Share2 size={16} />
          Share
        </button>
      </div>

      {/* Track details */}
      <div
        className="glass-card-static p-5"
        style={{ borderRadius: "var(--radius-xl)" }}>
        <h3
          className="text-sm font-semibold mb-3"
          style={{
            fontFamily: "var(--font-outfit)",
            color: "var(--text-primary)",
          }}>
          About this track
        </h3>
        {track.description && (
          <p
            className="text-sm mb-4 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}>
            {track.description}
          </p>
        )}
        <div
          className="flex flex-wrap gap-4 text-xs"
          style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            {formatDuration(track.duration)}
          </span>
          <span className="flex items-center gap-1.5">
            <HardDrive size={13} />
            {formatFileSize(track.fileSize)}
          </span>
        </div>
      </div>
    </div>
  );
}
