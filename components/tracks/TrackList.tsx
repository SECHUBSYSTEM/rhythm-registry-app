"use client";

import TrackCard, { TrackCardSkeleton } from "./TrackCard";
import type { Track } from "@/types";

interface TrackListProps {
  tracks: Track[];
  title?: string;
  variant?: "grid" | "compact" | "scroll";
  showCreator?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
}

export default function TrackList({
  tracks,
  title,
  variant = "grid",
  showCreator = true,
  emptyMessage = "No tracks found",
  isLoading = false,
}: TrackListProps) {
  if (isLoading) {
    const skeletons = Array(variant === "scroll" ? 5 : 4).fill(0);
    return (
      <section>
        {title && (
          <h2
            className="text-xl font-bold mb-4"
            style={{
              fontFamily: "var(--font-outfit)",
              color: "var(--text-primary)",
            }}>
            {title}
          </h2>
        )}

        {variant === "scroll" ? (
          <div className="scroll-row">
            {skeletons.map((_, i) => (
              <TrackCardSkeleton key={i} variant="grid" />
            ))}
          </div>
        ) : variant === "compact" ? (
          <div className="space-y-1 stagger-children">
            {skeletons.map((_, i) => (
              <TrackCardSkeleton key={i} variant="compact" />
            ))}
          </div>
        ) : (
          <div className="track-grid stagger-children">
            {skeletons.map((_, i) => (
              <TrackCardSkeleton key={i} variant="grid" />
            ))}
          </div>
        )}
      </section>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <section>
      {title && (
        <h2
          className="text-xl font-bold mb-4"
          style={{
            fontFamily: "var(--font-outfit)",
            color: "var(--text-primary)",
          }}>
          {title}
        </h2>
      )}

      {variant === "scroll" ? (
        <div className="scroll-row">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              variant="grid"
              showCreator={showCreator}
            />
          ))}
        </div>
      ) : variant === "compact" ? (
        <div className="space-y-1 stagger-children">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              variant="compact"
              showCreator={showCreator}
            />
          ))}
        </div>
      ) : (
        <div className="track-grid stagger-children">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              variant="grid"
              showCreator={showCreator}
            />
          ))}
        </div>
      )}
    </section>
  );
}
