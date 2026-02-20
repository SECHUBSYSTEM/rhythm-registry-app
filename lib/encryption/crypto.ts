/**
 * Web Crypto helpers for offline track encryption.
 * Track content is encrypted with a random AES-GCM key; that key is wrapped with the device key.
 */

const IV_LENGTH = 12;
const TAG_LENGTH = 128;

/**
 * Generate a new AES-256-GCM key for encrypting one track.
 */
export async function generateTrackKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a blob with the track key. Returns ArrayBuffer (IV + ciphertext + tag).
 */
export async function encryptBlob(
  blob: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    blob
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return combined.buffer;
}

/**
 * Decrypt a blob (IV + ciphertext + tag) with the track key.
 */
export async function decryptBlob(
  combined: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);
  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    ciphertext
  );
}

/**
 * Wrap (encrypt) the track key with the device key for storage.
 */
export async function wrapTrackKey(
  trackKey: CryptoKey,
  deviceKey: CryptoKey
): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const exported = await crypto.subtle.exportKey("raw", trackKey);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: TAG_LENGTH,
    },
    deviceKey,
    exported
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return combined.buffer;
}

/**
 * Unwrap (decrypt) the track key with the device key.
 */
export async function unwrapTrackKey(
  wrapped: ArrayBuffer,
  deviceKey: CryptoKey
): Promise<CryptoKey> {
  const iv = wrapped.slice(0, IV_LENGTH);
  const ciphertext = wrapped.slice(IV_LENGTH);
  const raw = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: TAG_LENGTH,
    },
    deviceKey,
    ciphertext
  );
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM" },
    false,
    ["decrypt", "encrypt"]
  );
}
