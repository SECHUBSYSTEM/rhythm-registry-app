/**
 * Device-bound key for offline playback.
 * Fingerprint is stable per device/browser; hash is sent to server for validation only.
 */

const SALT_KEY = "rhythm_registry_offline_salt";
const PBKDF2_ITERATIONS = 100000;

function getStoredSalt(): string {
  if (typeof window === "undefined") return "";
  let salt = localStorage.getItem(SALT_KEY);
  if (!salt) {
    salt = crypto.randomUUID() + "-" + Date.now();
    localStorage.setItem(SALT_KEY, salt);
  }
  return salt;
}

/**
 * Build a device fingerprint string (non-unique, stable per device).
 */
export function getDeviceFingerprint(): string {
  const parts: string[] = [];
  if (typeof navigator !== "undefined") {
    parts.push(navigator.userAgent);
    parts.push(navigator.platform ?? "");
    parts.push(String(navigator.hardwareConcurrency ?? 0));
    parts.push(new Intl.DateTimeFormat().resolvedOptions().timeZone);
  }
  parts.push(getStoredSalt());
  return parts.join("|");
}

/**
 * Hash the fingerprint for sending to the server (validation only).
 */
export async function hashFingerprintForServer(fingerprint: string): Promise<string> {
  const buf = new TextEncoder().encode(fingerprint);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derive a device key from user id + fingerprint (for wrapping track keys).
 */
export async function deriveDeviceKey(
  userId: string,
  fingerprint: string
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(userId + fingerprint),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("rhythm-registry-offline-v1"),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );
}
