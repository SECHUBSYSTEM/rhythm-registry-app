"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Send,
  Upload,
  Music,
  DollarSign,
} from "lucide-react";
import api from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { ListenerOrder, PreviewPlaylistItem } from "@/types";

function statusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const orderId = params?.orderId as string | undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<ListenerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [playlist, setPlaylist] = useState<PreviewPlaylistItem[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [submittingPlaylist, setSubmittingPlaylist] = useState(false);
  const [uploadingMix, setUploadingMix] = useState(false);
  const [mixTitle, setMixTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!orderId) return;
    api
      .get<ListenerOrder>(`/api/creator/assignments/${orderId}`)
      .then((res) => {
        setOrder(res.data);
        setMixTitle(res.data.eventType + " — Final Mix");
      })
      .catch(() => setError("Assignment not found"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleAccept = async () => {
    if (!orderId) return;
    setAccepting(true);
    setError("");
    try {
      await api.post(`/api/creator/assignments/${orderId}/accept`);
      setOrder((prev) => (prev ? { ...prev, status: "PLAYLIST_PENDING" } : null));
    } catch (err: unknown) {
      const res =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response
          : null;
      setError(res?.data?.error ?? "Failed to accept.");
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!orderId) return;
    setDeclining(true);
    setError("");
    try {
      await api.post(`/api/creator/assignments/${orderId}/decline`);
      setOrder(null);
      setError("You declined this assignment.");
    } catch (err: unknown) {
      const res =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response
          : null;
      setError(res?.data?.error ?? "Failed to decline.");
    } finally {
      setDeclining(false);
    }
  };

  const addPlaylistRow = () => {
    setPlaylist((prev) => [...prev, { title: "" }]);
  };

  const setPlaylistItem = (i: number, field: keyof PreviewPlaylistItem, value: string) => {
    setPlaylist((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const handleSubmitPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    setSubmittingPlaylist(true);
    setError("");
    try {
      await api.post(`/api/creator/assignments/${orderId}/playlist`, {
        playlistData: playlist.filter((p) => p.title?.trim() || p.uri?.trim()),
      });
      setOrder((prev) =>
        prev ? { ...prev, status: "PREVIEW_PLAYLIST_READY", previewPlaylist: playlist } : null
      );
    } catch (err: unknown) {
      const res =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response
          : null;
      setError(res?.data?.error ?? "Failed to submit playlist.");
    } finally {
      setSubmittingPlaylist(false);
    }
  };

  const handleUploadFinalMix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !selectedFile) return;
    const file = selectedFile;
    setUploadingMix(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("title", mixTitle.trim() || order?.eventType + " — Final Mix");
      const { data } = await api.post<{ trackId: string }>(
        `/api/creator/assignments/${orderId}/final-mix`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setOrder((prev) =>
        prev ? { ...prev, status: "PAYOUT_ELIGIBLE", finalTrackId: data?.trackId } : null
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      const res =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response
          : null;
      setError(res?.data?.error ?? "Failed to upload final mix.");
    } finally {
      setUploadingMix(false);
    }
  };

  if (loading || !orderId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner size="lg" label="Loading assignment..." />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="py-8">
        <p className="text-sm mb-4" style={{ color: "var(--rose-primary)" }}>
          {error}
        </p>
        <Link
          href="/dashboard/assignments"
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: "var(--text-secondary)" }}>
          <ChevronLeft size={16} /> Back to assignments
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const canAcceptDecline = order.status === "ASSIGNMENT_PENDING" || order.status === "ASSIGNED";
  const canSubmitPlaylist = ["PLAYLIST_PENDING", "REVISION_REQUESTED"].includes(order.status);
  const canUploadFinalMix = order.status === "PLAYLIST_APPROVED";
  const isEligibleForPay = order.status === "PAYOUT_ELIGIBLE";

  return (
    <div className="py-8 animate-fade-in-up max-w-2xl">
      <Link
        href="/dashboard/assignments"
        className="inline-flex items-center gap-2 text-sm mb-6"
        style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
        <ChevronLeft size={16} /> Back to assignments
      </Link>

      <div
        className="rounded-xl border p-6 mb-6"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border)",
        }}>
        <span
          className="text-xs font-medium px-2 py-1 rounded"
          style={{
            background: "var(--bg-base)",
            color: "var(--text-secondary)",
          }}>
          {statusLabel(order.status)}
        </span>
        <h1
          className="text-xl font-bold mt-3 mb-2"
          style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
          {order.eventType} — {order.eventDate}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {order.durationHours}h · Vibes: {order.vibeTags?.join(", ") ?? "—"}
        </p>
        {order.preferences && (
          <div className="mt-4 pt-4 border-t text-sm" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            {order.preferences.spotifyPlaylistUrl && (
              <p>Spotify: {order.preferences.spotifyPlaylistUrl}</p>
            )}
            {order.preferences.mustPlay && <p>Must play: {order.preferences.mustPlay}</p>}
            {order.preferences.doNotPlay && <p>Do not play: {order.preferences.doNotPlay}</p>}
            {order.preferences.notes && <p>Notes: {order.preferences.notes}</p>}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm mb-4" style={{ color: "var(--rose-primary)" }}>
          {error}
        </p>
      )}

      {canAcceptDecline && (
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={handleAccept}
            disabled={accepting}
            className="btn btn-primary inline-flex items-center gap-2">
            {accepting ? <LoadingSpinner size="sm" /> : <CheckCircle2 size={18} />}
            Accept
          </button>
          <button
            type="button"
            onClick={handleDecline}
            disabled={declining}
            className="btn border inline-flex items-center gap-2"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
            {declining ? <LoadingSpinner size="sm" /> : <XCircle size={18} />}
            Decline
          </button>
        </div>
      )}

      {canSubmitPlaylist && (
        <div
          className="rounded-xl border p-6 mb-6"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Preview playlist
          </h2>
          <form onSubmit={handleSubmitPlaylist} className="space-y-4">
            {playlist.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={item.title ?? ""}
                  onChange={(e) => setPlaylistItem(i, "title", e.target.value)}
                  placeholder="Track title"
                  className="input flex-1"
                  style={{
                    background: "var(--bg-base)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border)",
                  }}
                />
                <input
                  type="text"
                  value={item.uri ?? ""}
                  onChange={(e) => setPlaylistItem(i, "uri", e.target.value)}
                  placeholder="URI (optional)"
                  className="input flex-1"
                  style={{
                    background: "var(--bg-base)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border)",
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addPlaylistRow}
              className="text-sm"
              style={{ color: "var(--rose-primary)" }}>
              + Add track
            </button>
            <div>
              <button
                type="submit"
                disabled={submittingPlaylist}
                className="btn btn-primary inline-flex items-center gap-2">
                {submittingPlaylist ? <LoadingSpinner size="sm" /> : <Send size={16} />}
                Submit playlist
              </button>
            </div>
          </form>
        </div>
      )}

      {canUploadFinalMix && (
        <div
          className="rounded-xl border p-6 mb-6"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Deliver final mix
          </h2>
          <form onSubmit={handleUploadFinalMix} className="space-y-4">
            <input
              type="text"
              value={mixTitle}
              onChange={(e) => setMixTitle(e.target.value)}
              placeholder="Track title"
              className="input w-full"
              style={{
                background: "var(--bg-base)",
                color: "var(--text-primary)",
                borderColor: "var(--border)",
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.flac,.aac,.ogg,.m4a"
              className="block w-full text-sm"
              style={{ color: "var(--text-secondary)" }}
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="submit"
              disabled={uploadingMix || !selectedFile}
              className="btn btn-primary inline-flex items-center gap-2">
              {uploadingMix ? <LoadingSpinner size="sm" /> : <Upload size={18} />}
              Upload final mix
            </button>
          </form>
        </div>
      )}

      {isEligibleForPay && (
        <div
          className="rounded-xl border p-6 flex items-center gap-4"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}>
          <DollarSign size={24} style={{ color: "var(--rose-primary)" }} />
          <div>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Eligible for payout
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              This order has been delivered. You’re marked eligible for payout (no actual transfer in this app).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
