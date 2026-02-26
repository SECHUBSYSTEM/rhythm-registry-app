"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Mic2, Headphones } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import type { SignupRole } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();
  const roleFromUrl = useMemo(() => {
    const r = searchParams.get("role");
    return r === "creator" || r === "listener" ? r : null;
  }, [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleChoice, setRoleChoice] = useState<SignupRole>(roleFromUrl ?? "listener");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEmailVerificationMessage, setShowEmailVerificationMessage] =
    useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  const effectiveRole: SignupRole = roleFromUrl ?? roleChoice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup(trimmedName, email, password, effectiveRole);
      if (result.needsEmailVerification) {
        setVerificationEmail(result.email ?? email);
        setShowEmailVerificationMessage(true);
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setError("");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard`,
      },
    });
  };

  if (showEmailVerificationMessage) {
    return (
      <div className="animate-fade-in-up">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            fontFamily: "var(--font-outfit)",
            color: "var(--text-primary)",
          }}>
          Check your email
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          We&apos;ve sent a verification email to{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {verificationEmail}
          </strong>
          . Please check your inbox and click the link to verify your account.
        </p>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          After verifying, you can sign in below.
        </p>
        <Link
          href="/login"
          className="btn btn-primary btn-lg w-full inline-flex items-center justify-center"
          style={{ textDecoration: "none" }}>
          Back to login
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
        Create your account
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        {roleFromUrl === "creator"
          ? "Apply to share your original audio as a creator"
          : roleFromUrl === "listener"
            ? "Start listening to original audio as a Rhythm listener"
            : "Choose how you want to use Rhythm Registry"}
      </p>

      {/* Role selection (when not in URL) */}
      {roleFromUrl == null && (
        <div className="mb-6">
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--text-secondary)" }}>
            I want to be a
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRoleChoice("listener")}
              className={`p-4 rounded-xl border-2 text-left transition-colors flex items-center gap-3 ${
                roleChoice === "listener"
                  ? "border-rose-primary bg-rose-secondary/20"
                  : "border-border-subtle hover:border-border-default"
              }`}
              style={{ color: "var(--text-primary)" }}>
              <Headphones size={24} style={{ color: "var(--rose-light)" }} />
              <span className="font-medium">Rhythm listener</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleChoice("creator")}
              className={`p-4 rounded-xl border-2 text-left transition-colors flex items-center gap-3 ${
                roleChoice === "creator"
                  ? "border-rose-primary bg-rose-secondary/20"
                  : "border-border-subtle hover:border-border-default"
              }`}
              style={{ color: "var(--text-primary)" }}>
              <Mic2 size={24} style={{ color: "var(--rose-light)" }} />
              <span className="font-medium">Creator (producer)</span>
            </button>
          </div>
        </div>
      )}

      {/* Social buttons */}
      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          className="btn btn-secondary w-full justify-center"
          style={{ background: "var(--bg-elevated)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign up with Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("github")}
          className="btn btn-secondary w-full justify-center"
          style={{ background: "var(--bg-elevated)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Sign up with GitHub
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex-1 h-px"
          style={{ background: "var(--border-subtle)" }}
        />
        <span className="text-xs" style={{ color: "var(--text-disabled)" }}>
          or sign up with email
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: "var(--border-subtle)" }}
        />
      </div>

      {/* Error */}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--text-secondary)" }}>
            Display name
          </label>
          <div className="relative">
            <User
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              className="input pl-12"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
        </div>

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
            />
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--text-secondary)" }}>
            Password
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
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              Create account
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p
        className="text-sm text-center mt-6"
        style={{ color: "var(--text-muted)" }}>
        Already have an account?{" "}
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
