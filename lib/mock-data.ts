import type { Track, CreatorApplication } from "@/types";

// ── Mock Tracks ───────────────────────────────────────────────────────────

export const MOCK_TRACKS: Track[] = [
  {
    id: "track-001",
    title: "Sunset Frequencies",
    description: "A warm, melodic journey through sunset-inspired soundscapes.",
    creatorId: "creator-001",
    creatorName: "Luna Echo",
    duration: 5400,
    fileSize: 90_000_000,
    createdAt: "2025-12-15T00:00:00Z",
  },
  {
    id: "track-002",
    title: "Midnight Waves",
    description: "Deep, ambient tones flowing like ocean currents at midnight.",
    creatorId: "creator-001",
    creatorName: "Luna Echo",
    duration: 4320,
    fileSize: 72_000_000,
    createdAt: "2025-12-20T00:00:00Z",
    isOfflineAvailable: true,
  },
  {
    id: "track-003",
    title: "Urban Rhythm Vol 1",
    description: "City streets meet electronic beats — a 2-hour immersive mix.",
    creatorId: "creator-003",
    creatorName: "Pulse Collective",
    duration: 7200,
    fileSize: 120_000_000,
    createdAt: "2026-01-02T00:00:00Z",
  },
  {
    id: "track-004",
    title: "Morning Alchemy",
    description: "Gentle, uplifting tones to start your day with intention.",
    creatorId: "creator-002",
    creatorName: "Mindful Beats",
    duration: 3600,
    fileSize: 60_000_000,
    createdAt: "2026-01-08T00:00:00Z",
  },
  {
    id: "track-005",
    title: "Deep Focus Session #12",
    description:
      "Two hours of carefully curated focus music for deep work sessions.",
    creatorId: "creator-002",
    creatorName: "Mindful Beats",
    duration: 7200,
    fileSize: 120_000_000,
    createdAt: "2026-01-10T00:00:00Z",
    isOfflineAvailable: true,
  },
  {
    id: "track-006",
    title: "Bass Cathedral",
    description:
      "Cavernous bass frequencies in an experimental sound design piece.",
    creatorId: "creator-003",
    creatorName: "Pulse Collective",
    duration: 4800,
    fileSize: 80_000_000,
    createdAt: "2026-01-14T00:00:00Z",
  },
  {
    id: "track-007",
    title: "Dreamstate Podcast Ep.45",
    description:
      "Conversations about consciousness, music, and the creative process.",
    creatorId: "creator-004",
    creatorName: "Nova Dreamstate",
    duration: 5400,
    fileSize: 85_000_000,
    createdAt: "2026-01-18T00:00:00Z",
  },
  {
    id: "track-008",
    title: "Vinyl Nostalgia Mix",
    description:
      "A warm, lo-fi journey through classic grooves and dusty samples.",
    creatorId: "creator-001",
    creatorName: "Luna Echo",
    duration: 6600,
    fileSize: 110_000_000,
    createdAt: "2026-01-22T00:00:00Z",
  },
];

// ── Mock Creator Applications ─────────────────────────────────────────────

export const MOCK_APPLICATIONS: CreatorApplication[] = [
  {
    id: "app-001",
    userId: "user-010",
    userName: "Jordan Keys",
    userEmail: "jordan@example.com",
    bio: "Electronic music producer with 5 years of experience. I create ambient and downtempo mixes perfect for focused listening.",
    contentType: "music",
    links: {
      soundcloud: "https://soundcloud.com/jordankeys",
      youtube: "https://youtube.com/@jordankeys",
    },
    status: "pending",
    submittedAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "app-002",
    userId: "user-011",
    userName: "Priya Sharma",
    userEmail: "priya@example.com",
    bio: "Podcast host covering mindfulness and well-being. I want to share long-form guided meditation sessions.",
    contentType: "podcast",
    links: {
      youtube: "https://youtube.com/@priyawellness",
    },
    status: "pending",
    submittedAt: "2026-02-05T14:30:00Z",
  },
  {
    id: "app-003",
    userId: "user-012",
    userName: "Marcus Thornton",
    userEmail: "marcus@example.com",
    bio: "Multi-genre DJ and producer. I create both original mixes and a weekly podcast discussing the music scene.",
    contentType: "both",
    links: {
      soundcloud: "https://soundcloud.com/mthornton",
      other: "https://marcus-music.com",
    },
    status: "approved",
    submittedAt: "2026-01-20T09:00:00Z",
    reviewedAt: "2026-01-22T11:00:00Z",
  },
  {
    id: "app-004",
    userId: "user-013",
    userName: "Casey Morgan",
    userEmail: "casey@example.com",
    bio: "Aspiring content creator.",
    contentType: "music",
    status: "rejected",
    rejectionReason:
      "Application too brief — please provide more detail about your content and include links to your work.",
    submittedAt: "2026-01-15T16:00:00Z",
    reviewedAt: "2026-01-17T10:00:00Z",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHrs = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
