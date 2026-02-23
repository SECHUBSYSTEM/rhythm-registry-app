"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Maximize2,
} from "lucide-react";
import { useAudioPlayer } from "@/components/providers/AudioPlayerProvider";
import { formatDuration } from "@/lib/mock-data";

const IDLE_TIMEOUT = 3000; // 3 seconds before fading

export default function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    next,
    previous,
  } = useAudioPlayer();

  const [isIdle, setIsIdle] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simple helper – restarts the 3-second idle countdown
  const startIdleCountdown = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);
  };

  // Wake the player up on any interaction
  const wakePlayer = () => {
    setIsIdle(false);
    startIdleCountdown();
  };

  // Hover keeps it alive; leaving restarts the countdown
  const handleMouseEnter = () => {
    setIsIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
  };

  const handleMouseLeave = () => {
    startIdleCountdown();
  };

  // Kick off the first idle countdown on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);
    return () => clearTimeout(timer);
  }, []);

  if (!currentTrack) return null;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    seek(Math.max(0, Math.min(100, percent)));
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const vol = x / rect.width;
    setVolume(Math.max(0, Math.min(1, vol)));
  };

  // Deterministic cover gradient
  const hash = currentTrack.id
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hues = [340, 280, 220, 190, 160, 30, 0, 260];
  const hue = hues[hash % hues.length];
  const coverGradient = `linear-gradient(135deg, hsl(${hue}, 60%, 25%), hsl(${(hue + 40) % 360}, 50%, 15%))`;

  return (
    <div
      className="fixed left-0 right-0 z-50 bottom-[var(--mobile-nav-height)] md:bottom-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={wakePlayer}
      onClick={wakePlayer}
      style={{
        height: "var(--player-height)",
        background: "rgba(18, 18, 18, 0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
        opacity: isIdle ? 0.35 : 1,
        transition: "opacity 0.5s ease",
      }}>
      {/* Progress bar (top of player) */}
      <div
        className="progress-bar absolute top-0 left-0 right-0"
        onClick={handleSeek}
        style={{
          height: "3px",
          borderRadius: 0,
        }}>
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%`, borderRadius: 0 }}
        />
      </div>

      <div className="flex items-center h-full px-3 md:px-4 gap-3 md:gap-4 max-w-[1600px] mx-auto">
        {/* ── Track Info (left) ──────────────────────────────── */}
        <div className="flex items-center gap-3 min-w-0 w-[30%] md:w-[25%]">
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-lg shrink-0"
            style={{ background: coverGradient }}
          />
          <div className="min-w-0">
            <Link
              href={`/dashboard/player/${currentTrack.id}`}
              className="block text-sm font-medium truncate hover:underline"
              style={{
                color: "var(--text-primary)",
                textDecoration: "none",
              }}>
              {currentTrack.title}
            </Link>
            <p
              className="text-xs truncate"
              style={{ color: "var(--text-muted)" }}>
              {currentTrack.creatorName}
            </p>
          </div>
        </div>

        {/* ── Controls (centre) ─────────────────────────────── */}
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 mb-1">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className="btn-ghost btn-icon"
              style={{
                color: isShuffled ? "var(--rose-light)" : "var(--text-muted)",
              }}
              aria-label="Shuffle">
              <Shuffle size={16} />
            </button>

            {/* Previous */}
            <button
              onClick={previous}
              className="btn-ghost btn-icon"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Previous">
              <SkipBack size={18} fill="currentColor" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105"
              style={{ background: "white" }}
              aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? (
                <Pause size={18} fill="black" className="text-black" />
              ) : (
                <Play size={18} fill="black" className="text-black ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={next}
              className="btn-ghost btn-icon"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Next">
              <SkipForward size={18} fill="currentColor" />
            </button>

            {/* Repeat */}
            <button
              onClick={cycleRepeat}
              className="btn-ghost btn-icon"
              style={{
                color:
                  repeatMode !== "off"
                    ? "var(--rose-light)"
                    : "var(--text-muted)",
              }}
              aria-label="Repeat">
              {repeatMode === "one" ? (
                <Repeat1 size={16} />
              ) : (
                <Repeat size={16} />
              )}
            </button>
          </div>

          {/* Seek bar (hidden on small mobile, visible on larger) */}
          <div className="hidden sm:flex items-center gap-2 w-full max-w-md">
            <span
              className="text-[0.625rem] tabular-nums w-10 text-right"
              style={{ color: "var(--text-muted)" }}>
              {formatDuration(Math.round(currentTime))}
            </span>
            <div className="progress-bar flex-1" onClick={handleSeek}>
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span
              className="text-[0.625rem] tabular-nums w-10"
              style={{ color: "var(--text-muted)" }}>
              {formatDuration(currentTrack.duration)}
            </span>
          </div>
        </div>

        {/* ── Volume & extras (right) ─────────────────────── */}
        <div className="flex items-center gap-1 md:gap-2 justify-end">
          <Link
            href={`/dashboard/player/${currentTrack.id}`}
            className="btn-ghost btn-icon"
            style={{ color: "var(--text-muted)" }}
            aria-label="Expand player">
            <Maximize2 size={16} />
          </Link>

          <button
            onClick={toggleMute}
            className="btn-ghost btn-icon"
            style={{ color: "var(--text-muted)" }}
            aria-label={isMuted ? "Unmute" : "Mute"}>
            {isMuted || volume === 0 ? (
              <VolumeX size={16} />
            ) : (
              <Volume2 size={16} />
            )}
          </button>

          <div
            className="hidden md:block w-24 progress-bar"
            onClick={handleVolumeChange}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${(isMuted ? 0 : volume) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
