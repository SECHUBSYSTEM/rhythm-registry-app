// ─── User & Auth Types ─────────────────────────────────────────────────────

export type UserRole = "admin" | "creator" | "listener";

export interface Profile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  /** Set when listener has completed at least one payment */
  listenerAccessGrantedAt?: string;
}

// ─── Track Types ────────────────────────────────────────────────────────────

export interface Track {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  coverUrl?: string;
  duration: number; // seconds
  fileSize: number; // bytes
  createdAt: string; // ISO date
  isOfflineAvailable?: boolean;
}

// ─── Creator Application Types ──────────────────────────────────────────────

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface CreatorApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bio: string;
  contentType: "music" | "podcast" | "both";
  links?: {
    soundcloud?: string;
    youtube?: string;
    other?: string;
  };
  status: ApplicationStatus;
  rejectionReason?: string;
  submittedAt: string; // ISO date
  reviewedAt?: string; // ISO date
}

// ─── Audio Player Types ─────────────────────────────────────────────────────

export interface AudioPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number; // 0–100
  currentTime: number; // seconds
  volume: number; // 0–1
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: "off" | "all" | "one";
}

// ─── Upload Types ───────────────────────────────────────────────────────────

export interface UploadState {
  file: File | null;
  title: string;
  description: string;
  progress: number; // 0–100
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  error?: string;
}

// ─── Search Types ───────────────────────────────────────────────────────────

export interface SearchResult {
  tracks: Track[];
  total: number;
  query: string;
}

// ─── Navigation Types ───────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: UserRole[]; // If undefined, visible to all roles
  badge?: string;
}

// ─── Listener Orders & Access ──────────────────────────────────────────────

export const ORDER_STATUSES = [
  "AWAITING_ASSIGNMENT",
  "ASSIGNMENT_PENDING", // admin assigned; waiting for creator to accept/decline
  "ASSIGNED",
  "PLAYLIST_PENDING",
  "PREFERENCES_SUBMITTED",
  "PREVIEW_PLAYLIST_READY",
  "REVISION_REQUESTED",
  "PLAYLIST_APPROVED",
  "FINAL_DELIVERED",
  "PAYOUT_ELIGIBLE",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderPreferences {
  spotifyPlaylistUrl?: string;
  mustPlay?: string;
  doNotPlay?: string;
  specialMoments?: string;
  notes?: string;
}

export interface PreviewPlaylistItem {
  title?: string;
  id?: string;
  uri?: string;
}

export interface ListenerOrder {
  id: string;
  userId: string;
  stripeSessionId: string;
  eventType: string;
  eventDate: string;
  durationHours: number;
  vibeTags: string[] | null;
  rush: boolean;
  status: OrderStatus;
  assignedCreatorId: string | null;
  totalAmountCents: number;
  rushFeeCents: number;
  preferences?: OrderPreferences;
  previewPlaylist?: PreviewPlaylistItem[];
  revisionNotes?: string | null;
  playlistSubmittedAt?: string | null;
  finalTrackId?: string | null;
  createdAt: string;
  updatedAt: string;
}
