import { getOfflineDB, PLAYER_STATE_STORE } from "@/lib/offline-db";
import type { AudioPlayerState } from "@/types";

const PLAYER_STATE_KEY = "current";

export type PersistedPlayerState = Pick<
  AudioPlayerState,
  "currentTrack" | "progress" | "currentTime" | "isPlaying"
>;

export async function getPersistedPlayerState(): Promise<PersistedPlayerState | null> {
  if (typeof window === "undefined") return null;
  try {
    const db = await getOfflineDB();
    const raw = await db.get(PLAYER_STATE_STORE, PLAYER_STATE_KEY);
    if (!raw || typeof raw !== "object") return null;
    const parsed = raw as PersistedPlayerState;
    if (!parsed.currentTrack) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setPersistedPlayerState(
  state: PersistedPlayerState
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const db = await getOfflineDB();
    await db.put(PLAYER_STATE_STORE, state, PLAYER_STATE_KEY);
  } catch {
    // ignore
  }
}
