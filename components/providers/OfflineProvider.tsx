"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import api from "@/lib/api";
import { getOfflineDB, TRACKS_STORE } from "@/lib/offline-db";
import {
  getDeviceFingerprint,
  hashFingerprintForServer,
  deriveDeviceKey,
} from "@/lib/encryption/device-key";
import {
  generateTrackKey,
  encryptBlob,
  decryptBlob,
  wrapTrackKey,
  unwrapTrackKey,
} from "@/lib/encryption/crypto";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Track } from "@/types";


interface OfflineRecord {
  trackId: string;
  encryptedBlob: ArrayBuffer;
  wrappedKey: ArrayBuffer;
  metadata: Track;
  downloadedAt: string;
}

interface OfflineTrack extends Track {
  downloadedAt: string;
  encryptedSize: number;
}

interface OfflineContextType {
  offlineTracks: OfflineTrack[];
  isDownloading: string | null;
  downloadProgress: number;
  downloadTrack: (track: Track) => Promise<void>;
  removeOfflineTrack: (trackId: string) => Promise<void>;
  isTrackOffline: (trackId: string) => boolean;
  getPlayableUrl: (trackId: string, userId: string) => Promise<string | null>;
  totalStorageUsed: number;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [offlineTracks, setOfflineTracks] = useState<OfflineTrack[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const loadOfflineTracks = useCallback(async () => {
    const db = await getOfflineDB();
    const tx = db.transaction(TRACKS_STORE, "readonly");
    const store = tx.objectStore(TRACKS_STORE);
    const all = await store.getAll();
    await tx.done;
    const list: OfflineTrack[] = (all as OfflineRecord[]).map((r) => ({
      ...r.metadata,
      downloadedAt: r.downloadedAt,
      encryptedSize: r.encryptedBlob.byteLength,
    }));
    setOfflineTracks(list);
  }, []);

  useEffect(() => {
    loadOfflineTracks();
  }, [loadOfflineTracks]);

  const downloadTrack = useCallback(
    async (track: Track) => {
      if (offlineTracks.some((t) => t.id === track.id)) return;

      setIsDownloading(track.id);
      setDownloadProgress(0);

      try {
        const { data: streamData } = await api.get<{ url: string }>(
          `/api/stream/${track.id}`
        );
        const url = streamData?.url;
        if (!url) throw new Error("No stream URL");

        const res = await fetch(url);
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();

        setDownloadProgress(70);

        const trackKey = await generateTrackKey();
        const encryptedBlob = await encryptBlob(arrayBuffer, trackKey);

        const fingerprint = getDeviceFingerprint();
        const hash = await hashFingerprintForServer(fingerprint);
        const userId = user?.id;
        if (!userId) throw new Error("Not authenticated");
        const deviceKey = await deriveDeviceKey(userId, fingerprint);
        const wrappedKey = await wrapTrackKey(trackKey, deviceKey);

        const record: OfflineRecord = {
          trackId: track.id,
          encryptedBlob,
          wrappedKey,
          metadata: track,
          downloadedAt: new Date().toISOString(),
        };

        const db = await getOfflineDB();
        await db.put(TRACKS_STORE, record);
        await loadOfflineTracks();

        await api.post("/api/offline/register", {
          trackId: track.id,
          deviceFingerprintHash: hash,
        });
      } catch (e) {
        console.error("Offline download failed:", e);
      } finally {
        setIsDownloading(null);
        setDownloadProgress(0);
      }
    },
    [offlineTracks, loadOfflineTracks, user?.id]
  );

  const removeOfflineTrack = useCallback(async (trackId: string) => {
    const db = await getOfflineDB();
    await db.delete(TRACKS_STORE, trackId);
    await loadOfflineTracks();
  }, [loadOfflineTracks]);

  const isTrackOffline = useCallback(
    (trackId: string) => offlineTracks.some((t) => t.id === trackId),
    [offlineTracks]
  );

  const getPlayableUrl = useCallback(
    async (trackId: string, userId: string): Promise<string | null> => {
      const fingerprint = getDeviceFingerprint();
      const isOffline =
        typeof navigator !== "undefined" && !navigator.onLine;

      if (!isOffline) {
        const hash = await hashFingerprintForServer(fingerprint);
        const { data } = await api.get<{ allowed: boolean }>(
          "/api/offline/validate",
          { params: { trackId, deviceFingerprintHash: hash } }
        );
        if (!data?.allowed) return null;
      }

      const db = await getOfflineDB();
      const record = (await db.get(TRACKS_STORE, trackId)) as OfflineRecord | undefined;
      if (!record) return null;

      const deviceKey = await deriveDeviceKey(userId, fingerprint);
      const trackKey = await unwrapTrackKey(record.wrappedKey, deviceKey);
      const decrypted = await decryptBlob(record.encryptedBlob, trackKey);
      const blob = new Blob([decrypted]);
      return URL.createObjectURL(blob);
    },
    []
  );

  const totalStorageUsed = offlineTracks.reduce(
    (sum, t) => sum + (t.encryptedSize ?? 0),
    0
  );

  return (
    <OfflineContext.Provider
      value={{
        offlineTracks,
        isDownloading,
        downloadProgress,
        downloadTrack,
        removeOfflineTrack,
        isTrackOffline,
        getPlayableUrl,
        totalStorageUsed,
      }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineTrack(): OfflineContextType {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOfflineTrack must be used within an OfflineProvider");
  }
  return context;
}
