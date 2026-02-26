"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Music,
  Calendar,
  // Clock,
  ChevronLeft,
  Send,
  CheckCircle2,
  Edit3,
} from "lucide-react";
import api from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { ListenerOrder } from "@/types";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function statusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PREFERENCES_ALLOWED = ["AWAITING_ASSIGNMENT", "ASSIGNED"];
const CAN_REVISION_OR_APPROVE = "PREVIEW_PLAYLIST_READY";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.orderId as string | undefined;

  const [order, setOrder] = useState<ListenerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prefs, setPrefs] = useState({
    spotifyPlaylistUrl: "",
    mustPlay: "",
    doNotPlay: "",
    specialMoments: "",
    notes: "",
  });
  const [revisionNotes, setRevisionNotes] = useState("");
  const [submittingPrefs, setSubmittingPrefs] = useState(false);
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    api
      .get<ListenerOrder>(`/api/listener/orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch(() => setError("Order not found"))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (order?.preferences) {
      setPrefs({
        spotifyPlaylistUrl: order.preferences.spotifyPlaylistUrl ?? "",
        mustPlay: order.preferences.mustPlay ?? "",
        doNotPlay: order.preferences.doNotPlay ?? "",
        specialMoments: order.preferences.specialMoments ?? "",
        notes: order.preferences.notes ?? "",
      });
    }
  }, [order?.preferences]);

  const handleSubmitPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    const trimmed = {
      spotifyPlaylistUrl: prefs.spotifyPlaylistUrl.trim(),
      mustPlay: prefs.mustPlay.trim(),
      doNotPlay: prefs.doNotPlay.trim(),
      specialMoments: prefs.specialMoments.trim(),
      notes: prefs.notes.trim(),
    };

    if (!trimmed.spotifyPlaylistUrl) {
      setError("Spotify playlist URL is required.");
      return;
    }

    setSubmittingPrefs(true);
    setError("");
    try {
      await api.post(`/api/listener/orders/${orderId}/preferences`, trimmed);
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: "PREFERENCES_SUBMITTED",
              preferences: trimmed,
            }
          : null
      );
    } catch (err: unknown) {
      const res =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response
          : null;
      setError(res?.data?.error ?? "Failed to save preferences.");
    } finally {
      setSubmittingPrefs(false);
    }
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !revisionNotes.trim()) return;
    setSubmittingRevision(true);
    setError("");
    try {
      await api.post(`/api/listener/orders/${orderId}/revision`, {
        revisionNotes: revisionNotes.trim(),
      });
      setOrder((prev) =>
        prev ? { ...prev, status: "REVISION_REQUESTED" } : null
      );
      setRevisionNotes("");
    } catch (err: unknown) {
      const res =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response
          : null;
      setError(res?.data?.error ?? "Failed to submit revision.");
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleApprove = async () => {
    if (!orderId) return;
    setApproving(true);
    setError("");
    try {
      await api.post(`/api/listener/orders/${orderId}/approve-playlist`);
      setOrder((prev) =>
        prev ? { ...prev, status: "PLAYLIST_APPROVED" } : null
      );
    } catch (err: unknown) {
      const res =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response
          : null;
      setError(res?.data?.error ?? "Failed to approve.");
    } finally {
      setApproving(false);
    }
  };

  if (loading || !orderId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner size="lg" label="Loading order..." />
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
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: "var(--text-secondary)" }}>
          <ChevronLeft size={16} /> Back to orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const showPreferencesForm = PREFERENCES_ALLOWED.includes(order.status);
  const showPreviewSection =
    order.status === CAN_REVISION_OR_APPROVE &&
    (order.previewPlaylist?.length ?? 0) > 0;
  const canApproveOrRevision = order.status === CAN_REVISION_OR_APPROVE;
  const hasFinalMix = !!order.finalTrackId;

  return (
    <div className="py-8 animate-fade-in-up max-w-2xl">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-sm mb-6"
        style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
        <ChevronLeft size={16} /> Back to orders
      </Link>

      <div
        className="rounded-xl border p-6 mb-6"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border)",
        }}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className="text-xs font-medium px-2 py-1 rounded"
            style={{
              background: "var(--bg-base)",
              color: "var(--text-secondary)",
            }}>
            {statusLabel(order.status)}
          </span>
          {order.rush && (
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                background: "var(--rose-secondary)",
                color: "var(--rose-light)",
              }}>
              Rush
            </span>
          )}
        </div>
        <h1
          className="text-xl font-bold mb-2"
          style={{
            fontFamily: "var(--font-outfit)",
            color: "var(--text-primary)",
          }}>
          {order.eventType}
        </h1>
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
          <Calendar size={14} className="inline mr-1" />
          {order.eventDate} · {order.durationHours}h
        </p>
        <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
          {formatCents(order.totalAmountCents)}
          {order.rushFeeCents > 0 && (
            <span> (includes rush fee {formatCents(order.rushFeeCents)})</span>
          )}
        </p>
        {order.vibeTags?.length ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Vibes: {order.vibeTags.join(", ")}
          </p>
        ) : null}
      </div>

      {error && (
        <p className="text-sm mb-4" style={{ color: "var(--rose-primary)" }}>
          {error}
        </p>
      )}

      {showPreferencesForm && (
        <div
          className="rounded-xl border p-6 mb-6"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}>
          <h2
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}>
            <Edit3 size={18} /> Playlist preferences
          </h2>
          <form onSubmit={handleSubmitPreferences} noValidate className="space-y-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                Spotify playlist URL <span style={{ color: "var(--rose-primary)" }}>*</span>
              </label>
              <input
                type="url"
                required
                value={prefs.spotifyPlaylistUrl}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, spotifyPlaylistUrl: e.target.value }))
                }
                className="input w-full"
                style={{
                  background: "var(--bg-base)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
                placeholder="https://open.spotify.com/playlist/..."
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                Must play (optional)
              </label>
              <textarea
                value={prefs.mustPlay}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, mustPlay: e.target.value }))
                }
                rows={2}
                className="input w-full"
                style={{
                  background: "var(--bg-base)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                Do not play (optional)
              </label>
              <textarea
                value={prefs.doNotPlay}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, doNotPlay: e.target.value }))
                }
                rows={2}
                className="input w-full"
                style={{
                  background: "var(--bg-base)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                Special moments (optional)
              </label>
              <textarea
                value={prefs.specialMoments}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, specialMoments: e.target.value }))
                }
                rows={2}
                className="input w-full"
                style={{
                  background: "var(--bg-base)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                Notes (optional)
              </label>
              <textarea
                value={prefs.notes}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
                className="input w-full"
                style={{
                  background: "var(--bg-base)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={submittingPrefs || !prefs.spotifyPlaylistUrl.trim()}
              className="btn btn-secondary inline-flex items-center gap-2">
              {submittingPrefs ? <LoadingSpinner size="sm" /> : <Send size={16} />}
              Save preferences
            </button>
          </form>
        </div>
      )}

      {showPreviewSection && (
        <div
          className="rounded-xl border p-6 mb-6"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}>
          <h2
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}>
            <Music size={18} /> Preview playlist
          </h2>
          <ul className="list-decimal list-inside space-y-1 mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            {order.previewPlaylist?.map((item, i) => (
              <li key={i}>{item.title ?? item.uri ?? `Track ${i + 1}`}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving}
              className="btn btn-primary inline-flex items-center gap-2">
              {approving ? <LoadingSpinner size="sm" /> : <CheckCircle2 size={16} />}
              Approve playlist
            </button>
          </div>
          <form onSubmit={handleSubmitRevision} className="mt-6 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Request revision
            </label>
            <textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Describe what you’d like changed..."
              rows={3}
              className="input w-full mb-3"
              style={{
                background: "var(--bg-base)",
                color: "var(--text-primary)",
                borderColor: "var(--border)",
              }}
            />
            <button
              type="submit"
              disabled={submittingRevision || !revisionNotes.trim()}
              className="btn border inline-flex items-center gap-2"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
              {submittingRevision ? <LoadingSpinner size="sm" /> : <Send size={16} />}
              Send revision request
            </button>
          </form>
        </div>
      )}

      {canApproveOrRevision && !showPreviewSection && (
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Your creator is preparing a preview playlist. You’ll see it here when it’s ready.
        </p>
      )}

      {["PLAYLIST_APPROVED", "FINAL_DELIVERED", "PAYOUT_ELIGIBLE"].includes(order.status) && !hasFinalMix && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Your creator is preparing your final mix. It will appear in Your Library when ready.
        </p>
      )}

      {hasFinalMix && order.finalTrackId && (
        <div
          className="rounded-xl border p-6"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Your mix is ready
          </h2>
          <Link
            href={`/dashboard/player/${order.finalTrackId}`}
            className="btn btn-primary inline-flex items-center gap-2">
            <Music size={18} /> Play in library
          </Link>
        </div>
      )}
    </div>
  );
}
