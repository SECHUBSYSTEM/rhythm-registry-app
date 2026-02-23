"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { toast } from "react-toastify";
import api from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { useOfflineTrack } from "@/components/providers/OfflineProvider";
import {
  getPersistedPlayerState,
  setPersistedPlayerState,
} from "@/lib/offline-player-state";
import type { Track, AudioPlayerState } from "@/types";

// ── Context Types ─────────────────────────────────────────────────────────

interface AudioPlayerContextType extends AudioPlayerState {
  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (progress: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  next: () => void;
  previous: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined,
);

// ── Provider ──────────────────────────────────────────────────────────────

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const { user } = useAuth();
  const { isTrackOffline, getPlayableUrl } = useOfflineTrack();
  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    currentTime: 0,
    volume: 0.8,
    isMuted: false,
    isShuffled: false,
    repeatMode: "off",
  });
  const hasHydratedRef = useRef(false);

  // Hydrate from persisted player state (restore track/position; don't restore isPlaying to avoid play before src is set)
  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    getPersistedPlayerState().then((persisted) => {
      if (!persisted?.currentTrack) return;
      setState((prev) => ({
        ...prev,
        currentTrack: persisted.currentTrack,
        progress: persisted.progress ?? 0,
        currentTime: persisted.currentTime ?? 0,
        isPlaying: false,
      }));
    });
  }, []);

  // Persist now-playing state (debounced) for offline / reopen
  useEffect(() => {
    if (!state.currentTrack) return;
    const payload = {
      currentTrack: state.currentTrack,
      progress: state.progress,
      currentTime: state.currentTime,
      isPlaying: state.isPlaying,
    };
    const t = setTimeout(() => {
      setPersistedPlayerState(payload);
    }, 500);
    return () => clearTimeout(t);
  }, [
    state.currentTrack,
    state.progress,
    state.currentTime,
    state.isPlaying,
  ]);

  // Revoke previous object URL when track changes
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [state.currentTrack?.id]);

  // Fetch stream URL or offline playable URL when track changes
  useEffect(() => {
    if (!state.currentTrack) {
      if (audioRef.current) audioRef.current.src = "";
      return;
    }
    const trackId = state.currentTrack.id;
    let cancelled = false;

    if (isTrackOffline(trackId) && user?.id) {
      console.log("[AudioPlayer] Requesting offline playable URL for track", trackId);
      getPlayableUrl(trackId, user.id).then((url) => {
        if (cancelled || !audioRef.current || !url) return;
        console.log("[AudioPlayer] Offline URL received for track", trackId);
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = url;
        audioRef.current.src = url;
        if (state.isPlaying) {
          audioRef.current.play().catch((err) => {
            console.error("[AudioPlayer] Offline play failed:", err);
            toast.error("Playback failed. Try again.");
            setState((p) => ({ ...p, isPlaying: false }));
          });
        }
      });
    } else {
      console.log("[AudioPlayer] Requesting stream URL for track", trackId);
      api
        .get<{ url: string }>(`/api/stream/${trackId}`)
        .then((res) => {
          if (cancelled || !audioRef.current) return;
          const url = res.data?.url;
          if (!url) {
            console.error("[AudioPlayer] Stream API returned no url for track", trackId);
            toast.error("Could not load audio.");
            return;
          }
          console.log("[AudioPlayer] Stream URL received for track", trackId);
          audioRef.current.src = url;
          if (state.isPlaying) {
            audioRef.current.play().catch((err) => {
              console.error("[AudioPlayer] Play failed for track", trackId, err);
              toast.error("Playback failed. Check the track or try again.");
              setState((p) => ({ ...p, isPlaying: false }));
            });
          }
        })
        .catch((err) => {
          if (cancelled) return;
          const msg =
            err?.response?.data?.error ??
            err?.message ??
            "Could not load stream";
          console.error("[AudioPlayer] Stream request failed for track", trackId, err?.response?.status, msg, err);
          toast.error("Could not load audio. Try again.");
          setState((p) => ({ ...p, isPlaying: false }));
        });
    }

    return () => {
      cancelled = true;
    };
    // Intentionally only re-run when track id changes; isPlaying is applied in a separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stream URL does not depend on isPlaying
  }, [state.currentTrack?.id, isTrackOffline, getPlayableUrl, user?.id]);

  // Sync play/pause with audio element (only play when we have a real audio source)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const hasRealSource =
      el.src &&
      (el.src.startsWith("blob:") || el.src.startsWith("http://") || el.src.startsWith("https://")) &&
      el.src !== (typeof window !== "undefined" ? window.location.href : "");
    if (state.isPlaying) {
      if (!hasRealSource) {
        setState((p) => (p.isPlaying ? { ...p, isPlaying: false } : p));
        return;
      }
      el.play().catch((err) => {
        if (err?.name === "NotSupportedError") {
          setState((p) => ({ ...p, isPlaying: false }));
          return;
        }
        console.error("[AudioPlayer] Sync play failed:", err);
        toast.error("Playback failed.");
        setState((p) => ({ ...p, isPlaying: false }));
      });
    } else {
      el.pause();
    }
  }, [state.isPlaying, state.currentTrack?.id]);

  // Sync volume/mute to audio element
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = state.volume;
    el.muted = state.isMuted;
  }, [state.volume, state.isMuted]);

  // Attach audio events to sync state (duration from ref to avoid effect re-run loop)
  const durationRef = useRef<number | undefined>(state.currentTrack?.duration);
  durationRef.current = state.currentTrack?.duration;
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onLoadedMetadata = () => {
      const d = el.duration;
      if (Number.isFinite(d) && d > 0) {
        durationRef.current = d;
        setState((p) =>
          p.currentTrack && (p.currentTrack.duration == null || p.currentTrack.duration === 0)
            ? { ...p, currentTrack: { ...p.currentTrack, duration: d } }
            : p
        );
      }
    };
    const onTimeUpdate = () => {
      const duration = durationRef.current ?? el.duration;
      if (Number.isFinite(duration) && duration > 0) {
        const currentTime = el.currentTime;
        const progress = (currentTime / duration) * 100;
        setState((p) => (p.currentTrack ? { ...p, currentTime, progress } : p));
      }
    };
    const onPlay = () => setState((p) => ({ ...p, isPlaying: true }));
    const onPause = () => setState((p) => ({ ...p, isPlaying: false }));
    const onEnded = () =>
      setState((p) => ({
        ...p,
        isPlaying: false,
        progress: 0,
        currentTime: 0,
      }));
    const onError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const code = target?.error?.code;
      const message = target?.error?.message ?? "";
      const src = target?.src ?? "";
      const isEmptySrc =
        code === 4 ||
        message.toLowerCase().includes("empty src") ||
        !src ||
        src === window.location?.href;
      if (isEmptySrc) {
        return;
      }
      console.error("[AudioPlayer] Audio element error", {
        code,
        message,
        src: src.slice(0, 80),
      });
      toast.error("Audio failed to load. Try another track.");
      setState((p) => ({ ...p, isPlaying: false }));
    };
    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
    };
  }, [state.currentTrack?.id]);

  const play = useCallback((track: Track) => {
    setState((prev) => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
      progress: 0,
      currentTime: 0,
    }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) =>
      prev.currentTrack ? { ...prev, isPlaying: true } : prev,
    );
  }, []);

  const togglePlay = useCallback(() => {
    setState((prev) =>
      prev.currentTrack ? { ...prev, isPlaying: !prev.isPlaying } : prev,
    );
  }, []);

  const seek = useCallback(
    (progress: number) => {
      const el = audioRef.current;
      const duration = state.currentTrack?.duration;
      if (el && duration != null && Number.isFinite(duration) && duration > 0) {
        el.currentTime = (progress / 100) * duration;
      }
      setState((prev) => {
        if (!prev.currentTrack) return prev;
        const d = prev.currentTrack.duration;
        const currentTime =
          d != null && Number.isFinite(d) ? (progress / 100) * d : 0;
        return { ...prev, progress, currentTime };
      });
    },
    [state.currentTrack?.duration],
  );

  const setVolume = useCallback((volume: number) => {
    setState((prev) => ({
      ...prev,
      volume: Math.max(0, Math.min(1, volume)),
      isMuted: volume === 0,
    }));
  }, []);

  const toggleMute = useCallback(() => {
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const toggleShuffle = useCallback(() => {
    setState((prev) => ({ ...prev, isShuffled: !prev.isShuffled }));
  }, []);

  const cycleRepeat = useCallback(() => {
    setState((prev) => ({
      ...prev,
      repeatMode:
        prev.repeatMode === "off"
          ? "all"
          : prev.repeatMode === "all"
            ? "one"
            : "off",
    }));
  }, []);

  const next = useCallback(() => {
    setState((prev) => ({ ...prev, progress: 0, currentTime: 0 }));
  }, []);

  const previous = useCallback(() => {
    setState((prev) => ({ ...prev, progress: 0, currentTime: 0 }));
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        ...state,
        play,
        pause,
        resume,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        next,
        previous,
      }}>
      <audio ref={audioRef} preload="metadata" />
      {children}
    </AudioPlayerContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useAudioPlayer(): AudioPlayerContextType {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error(
      "useAudioPlayer must be used within an AudioPlayerProvider",
    );
  }
  return context;
}
