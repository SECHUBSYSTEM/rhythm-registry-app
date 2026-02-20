"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import TrackList from "@/components/tracks/TrackList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import type { Track } from "@/types";
import { Sparkles, TrendingUp, Clock } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting] = useState(() => getGreeting());

  useEffect(() => {
    let cancelled = false;
    api
      .get<Track[]>("/api/tracks")
      .then((res) => {
        if (!cancelled) setTracks(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load tracks.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner size="lg" label="Loading tracks..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="text-text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-fade-in">
      {/* Header */}
      <section>
        <h1
          className="text-2xl md:text-3xl font-bold mb-1"
          style={{ fontFamily: "var(--font-outfit)" }}>
          {greeting},{" "}
          <span className="gradient-text">
            {user?.displayName?.split(" ")[0] ?? "there"}
          </span>
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Pick up where you left off, or discover something new.
        </p>
      </section>

      {/* Recently Played – horizontal scroll */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} style={{ color: "var(--rose-light)" }} />
          <h2
            className="text-lg md:text-xl font-bold"
            style={{ fontFamily: "var(--font-outfit)" }}>
            Recently Played
          </h2>
        </div>
        <TrackList
          tracks={tracks.slice(0, 5)}
          variant="scroll"
          emptyMessage="Nothing played yet — start exploring!"
        />
      </section>

      {/* Trending Now – grid */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} style={{ color: "var(--rose-light)" }} />
          <h2
            className="text-lg md:text-xl font-bold"
            style={{ fontFamily: "var(--font-outfit)" }}>
            Trending Now
          </h2>
        </div>
        <TrackList tracks={tracks.slice(0, 4)} variant="grid" />
      </section>

      {/* New Releases – grid */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} style={{ color: "var(--rose-light)" }} />
          <h2
            className="text-lg md:text-xl font-bold"
            style={{ fontFamily: "var(--font-outfit)" }}>
            New Releases
          </h2>
        </div>
        <TrackList tracks={tracks.slice(3)} variant="grid" />
      </section>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
