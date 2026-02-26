"use client";

import { useState } from "react";
import { Calendar, Clock, Music, Zap, User, Mail } from "lucide-react";
import api from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { calculateCheckoutAmount } from "@/lib/stripe/pricing";

const EVENT_TYPE_OPTIONS = [
  "Wedding",
  "Birthday party",
  "Anniversary",
  "Graduation",
  "Baby shower",
  "House party",
  "Dinner party",
  "Engagement",
  "Gender reveal",
  "Other events",
];

const VIBE_OPTIONS = [
  "Chill",
  "Upbeat",
  "Romantic",
  "Party",
  "Afrobeat",
  "R&B",
  "Hip-Hop",
  "Electronic",
  "Pop",
  "Jazz",
  "Indie",
];

export default function OnboardingPage() {
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [durationHours, setDurationHours] = useState(4);
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [rush, setRush] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleVibe = (vibe: string) => {
    setVibeTags((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!eventType.trim()) {
      setError("Event type is required.");
      return;
    }
    if (!eventDate.trim()) {
      setError("Event date is required.");
      return;
    }
    if (vibeTags.length === 0) {
      setError("Select at least one vibe.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post<{ url: string }>("/api/checkout", {
        eventType: eventType.trim(),
        eventDate: eventDate.trim(),
        durationHours,
        vibeTags,
        rush,
        name: name.trim(),
        email: email.trim(),
      });
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError("Could not start checkout.");
    } catch (err: unknown) {
      const res = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response
        : null;
      setError(res?.data?.error ?? "Checkout failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const {
    totalAmountCents,
    rushFeeCents,
    baseAmountCents,
  } = calculateCheckoutAmount(durationHours, rush);

  const formatDollars = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);

  return (
    <div className="max-w-lg mx-auto py-8 md:py-12 animate-fade-in-up">
      <h1
        className="text-2xl md:text-3xl font-bold mb-2"
        style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
        Get your custom mix
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Tell us about your event and we&apos;ll match you with a creator.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-secondary)" }}>
            Event type
          </label>
          <div className="relative">
            <Music
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10"
              style={{ color: "var(--text-muted)" }}
            />
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="input w-full pl-10 appearance-none cursor-pointer"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                borderColor: "var(--border)",
              }}>
              <option value="">Select event type</option>
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-secondary)" }}>
            Event date
          </label>
          <div className="relative">
            <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="input w-full pl-10"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                borderColor: "var(--border)",
              }}
            />
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-secondary)" }}>
            Duration (hours)
          </label>
          <div className="flex items-center gap-2">
            <Clock
              className="w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="input flex-1"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                borderColor: "var(--border)",
              }}>
              {[2, 3, 4, 5, 6].map((h) => (
                <option key={h} value={h}>
                  {h} {h === 1 ? "hour" : "hours"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-secondary)" }}>
            Vibes (select at least one)
          </label>
          <div className="flex flex-wrap gap-2">
            {VIBE_OPTIONS.map((vibe) => (
              <button
                key={vibe}
                type="button"
                onClick={() => toggleVibe(vibe)}
                className="px-3 py-1.5 rounded-full text-sm border transition-colors"
                style={{
                  background: vibeTags.includes(vibe)
                    ? "var(--rose-primary)"
                    : "var(--bg-elevated)",
                  color: vibeTags.includes(vibe)
                    ? "var(--rose-light) var(--text-primary)"
                    : "var(--text-secondary)",
                  borderColor: vibeTags.includes(vibe)
                    ? "var(--rose-primary)"
                    : "var(--border)",
                }}>
                {vibe}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={rush}
              onClick={() => setRush((prev) => !prev)}
              className="relative inline-flex h-6 w-11 items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              style={{
                background: rush ? "var(--rose-primary)" : "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                style={{
                  transform: rush ? "translateX(1.25rem)" : "translateX(0.1rem)",
                }}
              />
            </button>

            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <Zap className="inline w-4 h-4 mr-1" />
              Rush delivery{" "}
              <span className="text-xs opacity-75">
                (+{formatDollars(rushFeeCents || 20000)})
              </span>
            </span>
          </div>
        </div>

        <div
          className="rounded-lg border px-4 py-3 space-y-1 text-sm"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-secondary)" }}>
              {durationHours}-hour custom mix
            </span>
            <span style={{ color: "var(--text-primary)" }}>
              {formatDollars(baseAmountCents)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-secondary)" }}>Rush fee</span>
            <span
              style={{
                color: rush ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              {rush
                ? formatDollars(rushFeeCents)
                : formatDollars(0)}
            </span>
          </div>
          <div
            className="mt-2 border-t pt-2 flex items-center justify-between font-semibold"
            style={{ borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--text-secondary)" }}>Total</span>
            <span style={{ color: "var(--text-primary)" }}>
              {formatDollars(totalAmountCents)}
            </span>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-secondary)" }}>
            Your name
          </label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="input w-full pl-10"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                borderColor: "var(--border)",
              }}
            />
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-secondary)" }}>
            Email
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input w-full pl-10"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                borderColor: "var(--border)",
              }}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--rose-primary)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-secondary btn-lg w-full inline-flex items-center justify-center gap-2">
          {isSubmitting ? (
            <LoadingSpinner size="sm" />
          ) : (
            "Continue to payment"
          )}
        </button>
      </form>
    </div>
  );
}
