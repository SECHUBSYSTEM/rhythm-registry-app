// ─── User & Auth Types ─────────────────────────────────────────────────────

export type UserRole = 'admin' | 'creator' | 'listener';

export interface Profile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

// ─── Track Types ────────────────────────────────────────────────────────────

export interface Track {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  coverUrl?: string;
  duration: number;       // seconds
  fileSize: number;       // bytes
  createdAt: string;      // ISO date
  isOfflineAvailable?: boolean;
}

// ─── Creator Application Types ──────────────────────────────────────────────

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface CreatorApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bio: string;
  contentType: 'music' | 'podcast' | 'both';
  links?: {
    soundcloud?: string;
    youtube?: string;
    other?: string;
  };
  status: ApplicationStatus;
  rejectionReason?: string;
  submittedAt: string;    // ISO date
  reviewedAt?: string;    // ISO date
}

// ─── Audio Player Types ─────────────────────────────────────────────────────

export interface AudioPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;       // 0–100
  currentTime: number;    // seconds
  volume: number;         // 0–1
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: 'off' | 'all' | 'one';
}

// ─── Upload Types ───────────────────────────────────────────────────────────

export interface UploadState {
  file: File | null;
  title: string;
  description: string;
  progress: number;       // 0–100
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
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
