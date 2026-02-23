import { openDB } from "idb";

export const OFFLINE_DB_NAME = "rhythm-registry-offline";
export const TRACKS_STORE = "tracks";
export const PLAYER_STATE_STORE = "playerState";
const DB_VERSION = 2;

export async function getOfflineDB() {
  return openDB(OFFLINE_DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(TRACKS_STORE)) {
        db.createObjectStore(TRACKS_STORE, { keyPath: "trackId" });
      }
      if (!db.objectStoreNames.contains(PLAYER_STATE_STORE)) {
        db.createObjectStore(PLAYER_STATE_STORE);
      }
    },
  });
}
