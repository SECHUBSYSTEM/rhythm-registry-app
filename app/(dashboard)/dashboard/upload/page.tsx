"use client";

import { useState, useEffect } from "react";
import { Upload, Clock } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import UploadForm from "@/components/upload/UploadForm";
import TrackList from "@/components/tracks/TrackList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import type { Track } from "@/types";

export default function UploadPage() {
  const { role } = useAuth();
  const [myUploads, setMyUploads] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "admin" && role !== "creator") {
      queueMicrotask(() => setLoading(false));
      return;
    }
    api
      .get<Track[]>("/api/tracks", { params: { mine: "1" } })
      .then((res) => setMyUploads(res.data ?? []))
      .catch(() => setMyUploads([]))
      .finally(() => setLoading(false));
  }, [role]);

  // Only creators and admins can upload
  if (role === "listener") {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--bg-elevated)" }}>
          <Upload size={24} style={{ color: "var(--text-muted)" }} />
        </div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ fontFamily: "var(--font-outfit)" }}>
          Creator access required
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          You need to be an approved creator to upload tracks.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "var(--rose-secondary)" }}>
          <Upload size={22} style={{ color: "var(--rose-light)" }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-outfit)" }}>
            Upload
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Share your original audio with the community
          </p>
        </div>
      </div>

      {/* Upload form */}
      <div
        className="glass-card-static p-6 mb-10"
        style={{ borderRadius: "var(--radius-xl)" }}>
        <UploadForm
          onSuccess={(track) => setMyUploads((prev) => [track, ...prev])}
        />
      </div>

      {/* Recent uploads */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} style={{ color: "var(--rose-light)" }} />
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: "var(--font-outfit)" }}>
            Your Recent Uploads
          </h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <TrackList
            tracks={myUploads}
            variant="compact"
            showCreator={false}
            emptyMessage="You haven't uploaded anything yet."
          />
        )}
      </section>
    </div>
  );
}
