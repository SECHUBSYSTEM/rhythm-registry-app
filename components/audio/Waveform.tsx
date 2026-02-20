"use client";

import { useState, useEffect } from "react";

interface WaveformProps {
  isPlaying?: boolean;
  barCount?: number;
  height?: number;
}

export default function Waveform({
  isPlaying = false,
  barCount = 40,
  height = 60,
}: WaveformProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  return (
    <div
      className="flex items-end justify-center gap-[2px] w-full"
      style={{ height }}
      role="img"
      aria-label="Audio waveform visualisation">
      {mounted &&
        Array.from({ length: barCount }).map((_, i) => {
          // Generate a pseudo-random but deterministic height for each bar
          const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
          const normalised = seed - Math.floor(seed);
          const barHeight = 15 + normalised * 85; // 15%–100% height

          return (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: "3px",
                height: `${barHeight}%`,
                background: isPlaying
                  ? `linear-gradient(to top, var(--rose-primary), var(--rose-light))`
                  : "var(--bg-highlight)",
                transition: "background var(--transition-base)",
                animation: isPlaying
                  ? `waveBar ${0.4 + normalised * 0.6}s ease-in-out ${normalised * 0.3}s infinite alternate`
                  : "none",
                opacity: isPlaying ? 1 : 0.5,
              }}
            />
          );
        })}
    </div>
  );
}
