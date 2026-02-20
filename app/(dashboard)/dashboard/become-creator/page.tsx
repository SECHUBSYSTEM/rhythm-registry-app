"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  Clock,
  XCircle,
  Music,
  Podcast,
  Radio,
  Link as LinkIcon,
} from "lucide-react";
import api from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type Status = "not-applied" | "pending" | "rejected";

export default function BecomeCreatorPage() {
  const [status, setStatus] = useState<Status | "loading">("loading");
  const [rejectionReason, setRejectionReason] = useState("");
  const [bio, setBio] = useState("");
  const [contentType, setContentType] = useState<"music" | "podcast" | "both">(
    "music",
  );
  const [links, setLinks] = useState({
    soundcloud: "",
    youtube: "",
    other: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    api
      .get<{ application: { status: string; rejectionReason?: string } | null; status: string }>(
        "/api/creator/application"
      )
      .then((res) => {
        const st = res.data.status ?? res.data.application?.status;
        if (st === "pending") setStatus("pending");
        else if (st === "rejected") {
          setStatus("rejected");
          setRejectionReason(res.data.application?.rejectionReason ?? "");
        } else setStatus("not-applied");
      })
      .catch(() => setStatus("not-applied"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);
    try {
      await api.post("/api/creator/apply", {
        bio: bio.trim(),
        contentType,
        links,
      });
      setStatus("pending");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Submit failed.";
      setSubmitError(msg ?? "Submit failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contentTypes = [
    { value: "music" as const, label: "Music", icon: <Music size={18} /> },
    {
      value: "podcast" as const,
      label: "Podcast",
      icon: <Podcast size={18} />,
    },
    { value: "both" as const, label: "Both", icon: <Radio size={18} /> },
  ];

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner size="lg" label="Loading..." />
      </div>
    );
  }

  // ── Pending State ──────────────────────────────────────────────────────
  if (status === "pending") {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in-up">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow"
          style={{ background: "var(--rose-secondary)" }}>
          <Clock size={28} style={{ color: "var(--rose-light)" }} />
        </div>
        <h1
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: "var(--font-outfit)" }}>
          Application pending
        </h1>
        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: "var(--text-muted)" }}>
          Your creator application is being reviewed. We&apos;ll notify you once
          a decision has been made. This usually takes 3–5 business days.
        </p>
        <span className="badge badge-warning">
          <Clock size={10} />
          Under review
        </span>
      </div>
    );
  }

  // ── Rejected State ─────────────────────────────────────────────────────
  if (status === "rejected") {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in-up">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(239, 68, 68, 0.15)" }}>
          <XCircle size={28} style={{ color: "var(--error)" }} />
        </div>
        <h1
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: "var(--font-outfit)" }}>
          Application not approved
        </h1>
        <p
          className="text-sm leading-relaxed mb-4"
          style={{ color: "var(--text-muted)" }}>
          Unfortunately, your application was not approved this time.
        </p>
        <div
          className="glass-card-static p-4 text-left mb-6"
          style={{ borderRadius: "var(--radius-lg)" }}>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}>
            Reason:
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {rejectionReason || "Application did not meet requirements."}
          </p>
        </div>
        <button
          onClick={() => {
            setStatus("not-applied");
            setRejectionReason("");
          }}
          className="btn btn-primary">
          <Send size={16} />
          Re-apply
        </button>
      </div>
    );
  }

  // ── Application Form ───────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "var(--rose-secondary)",
          }}>
          <Sparkles size={28} style={{ color: "var(--rose-light)" }} />
        </div>
        <h1
          className="text-2xl md:text-3xl font-bold mb-2"
          style={{ fontFamily: "var(--font-outfit)" }}>
          Become a Creator
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Apply to upload and share your original audio on Rhythm Registry.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bio */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-secondary)" }}>
            Why do you want to be a creator?{" "}
            <span style={{ color: "var(--rose-light)" }}>*</span>
          </label>
          <textarea
            className="input"
            rows={4}
            placeholder="Tell us about yourself and the kind of content you create…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
          />
        </div>

        {/* Content type */}
        <div>
          <label
            className="block text-sm font-medium mb-3"
            style={{ color: "var(--text-secondary)" }}>
            Content type <span style={{ color: "var(--rose-light)" }}>*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {contentTypes.map((ct) => (
              <button
                key={ct.value}
                type="button"
                onClick={() => setContentType(ct.value)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                style={{
                  background:
                    contentType === ct.value
                      ? "var(--rose-secondary)"
                      : "var(--bg-elevated)",
                  border: `1px solid ${contentType === ct.value ? "var(--rose-primary)" : "var(--border-subtle)"}`,
                  color:
                    contentType === ct.value
                      ? "var(--rose-light)"
                      : "var(--text-muted)",
                }}>
                {ct.icon}
                <span className="text-xs font-medium">{ct.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-secondary)" }}>
            Links{" "}
            <span
              className="text-xs font-normal"
              style={{ color: "var(--text-muted)" }}>
              (optional)
            </span>
          </label>
          <div className="space-y-3">
            <div className="relative">
              <LinkIcon
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="url"
                className="input pl-11"
                placeholder="SoundCloud URL"
                value={links.soundcloud}
                onChange={(e) =>
                  setLinks((prev) => ({ ...prev, soundcloud: e.target.value }))
                }
              />
            </div>
            <div className="relative">
              <LinkIcon
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="url"
                className="input pl-11"
                placeholder="YouTube URL"
                value={links.youtube}
                onChange={(e) =>
                  setLinks((prev) => ({ ...prev, youtube: e.target.value }))
                }
              />
            </div>
            <div className="relative">
              <LinkIcon
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="url"
                className="input pl-11"
                placeholder="Other (website, social media)"
                value={links.other}
                onChange={(e) =>
                  setLinks((prev) => ({ ...prev, other: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        {submitError && (
          <p className="text-sm" style={{ color: "var(--error)" }}>
            {submitError}
          </p>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          disabled={isSubmitting || !bio.trim()}
          style={{
            opacity: isSubmitting || !bio.trim() ? 0.6 : 1,
          }}>
          {isSubmitting ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <Send size={16} />
              Submit application
            </>
          )}
        </button>
      </form>
    </div>
  );
}
