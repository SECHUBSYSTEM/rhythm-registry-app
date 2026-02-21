"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address.");
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        trimmed,
        { redirectTo: `${origin}/auth/callback?next=/reset-password` }
      );
      if (err) throw err;
      setSent(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="animate-fade-in-up">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ background: "rgba(29, 185, 84, 0.15)" }}>
          <CheckCircle2 size={24} style={{ color: "var(--success)" }} />
        </div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{
            fontFamily: "var(--font-outfit)",
            color: "var(--text-primary)",
          }}>
          Check your email
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          We&apos;ve sent a password reset link to{" "}
          <strong style={{ color: "var(--text-primary)" }}>{email.trim()}</strong>
          . Click the link to set a new password.
        </p>
        <Link
          href="/login"
          className="btn btn-primary btn-lg w-full inline-flex items-center justify-center gap-2"
          style={{ textDecoration: "none" }}>
          Back to sign in
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h1
        className="text-3xl font-bold mb-2"
        style={{
          fontFamily: "var(--font-outfit)",
          color: "var(--text-primary)",
        }}>
        Reset password
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      {error && (
        <div
          className="p-3 rounded-lg text-sm mb-4"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            color: "var(--error)",
          }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--text-secondary)" }}>
            Email address
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="email"
              className="input pl-12"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-full inline-flex items-center justify-center gap-2"
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              Send reset link
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p
        className="text-sm text-center mt-6"
        style={{ color: "var(--text-muted)" }}>
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium"
          style={{ color: "var(--rose-light)", textDecoration: "none" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
