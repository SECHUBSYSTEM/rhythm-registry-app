"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      if (!session) router.replace("/forgot-password");
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => router.push("/login?reset=1"), 1500);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not update password. Try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (hasSession === null) {
    return (
      <div className="animate-fade-in-up flex justify-center py-12">
        <span
          className="animate-spin inline-block w-8 h-8 rounded-full border-2"
          style={{
            borderColor: "var(--border-subtle)",
            borderTopColor: "var(--rose-primary)",
          }}
        />
      </div>
    );
  }

  if (success) {
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
          Password updated
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Redirecting you to sign in with your new password...
        </p>
        <div className="flex justify-center">
          <span
            className="animate-spin inline-block w-6 h-6 rounded-full border-2"
            style={{
              borderColor: "var(--border-subtle)",
              borderTopColor: "var(--rose-primary)",
            }}
          />
        </div>
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
        Set new password
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Enter your new password below.
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
            New password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type={showPassword ? "text" : "password"}
              className="input pl-12 pr-10"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{
                color: "var(--text-muted)",
                background: "none",
                border: "none",
              }}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--text-secondary)" }}>
            Confirm password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type={showPassword ? "text" : "password"}
              className="input pl-12"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
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
              Update password
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p
        className="text-sm text-center mt-6"
        style={{ color: "var(--text-muted)" }}>
        <Link
          href="/login"
          className="font-medium"
          style={{ color: "var(--rose-light)", textDecoration: "none" }}>
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
