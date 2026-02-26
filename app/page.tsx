"use client";

import Link from "next/link";
import {
  Headphones,
  Download,
  Shield,
  Mic2,
  Play,
  ArrowRight,
  Zap,
  Radio,
  Lock,
} from "lucide-react";
import Waveform from "@/components/audio/Waveform";

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-base)" }}>
      {/* ── Navbar ────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8"
        style={{
          height: "var(--navbar-height)",
          background: "rgba(10, 10, 10, 0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2"
          style={{ textDecoration: "none" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--rose-primary)" }}
          >
            <Mic2 size={18} className="text-white" />
          </div>
          <span
            className="text-lg font-bold"
            style={{
              fontFamily: "var(--font-outfit)",
              color: "var(--text-primary)",
            }}
          >
            Rhythm Registry
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
            }}
          >
            Log in
          </Link>
          <Link href="/signup?role=listener" className="btn btn-outline btn-sm">
            Be a listener
          </Link>
          <Link href="/signup?role=creator" className="btn btn-primary btn-sm">
            Be a creator
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ paddingTop: "var(--navbar-height)" }}
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(136, 19, 55, 0.25) 0%, transparent 70%), var(--bg-base)",
          }}
        />

        {/* Floating orbs */}
        <div
          className="absolute w-64 h-64 md:w-96 md:h-96 rounded-full animate-float opacity-20"
          style={{
            background:
              "radial-gradient(circle, var(--rose-primary), transparent)",
            top: "10%",
            right: "5%",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute w-48 h-48 md:w-72 md:h-72 rounded-full animate-float opacity-15"
          style={{
            background:
              "radial-gradient(circle, var(--rose-light), transparent)",
            bottom: "15%",
            left: "10%",
            filter: "blur(50px)",
            animationDelay: "1.5s",
          }}
        />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 badge badge-rose mb-6 animate-fade-in-up">
            <Zap size={12} />
            Original Audio · Encrypted Offline
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up"
            style={{
              fontFamily: "var(--font-outfit)",
              lineHeight: 1.1,
              animationDelay: "100ms",
            }}
          >
            Your sound.
            <br />
            <span className="gradient-text">Your way.</span>
          </h1>

          <p
            className="text-base sm:text-lg md:text-xl max-w-xl mx-auto mb-8 animate-fade-in-up"
            style={{
              color: "var(--text-secondary)",
              animationDelay: "200ms",
            }}
          >
            Stream, discover, and download original audio. Curated mixes,
            podcasts, and soundscapes — with encrypted offline playback.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <Link href="/signup?role=listener" className="btn btn-primary btn-lg">
              <Play size={18} fill="white" />
              Be a Rhythm listener
            </Link>
            <Link href="/signup?role=creator" className="btn btn-outline btn-lg">
              <Mic2 size={18} />
              Be a creator
            </Link>
            <Link href="/login" className="btn btn-ghost btn-lg">
              I have an account
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Waveform decoration */}
          <div
            className="max-w-lg mx-auto opacity-40 animate-fade-in"
            style={{ animationDelay: "500ms" }}
          >
            <Waveform isPlaying barCount={60} height={50} />
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section
        className="py-20 md:py-28 px-4"
        style={{
          background:
            "linear-gradient(180deg, var(--bg-base), var(--bg-surface))",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Built for <span className="gradient-text">real listening</span>
          </h2>
          <p
            className="text-center max-w-lg mx-auto mb-12 md:mb-16"
            style={{ color: "var(--text-muted)" }}
          >
            Long-form audio experiences, not 3-minute tracks. Rhythm Registry is
            designed for deep listening.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            <FeatureCard
              icon={<Headphones size={24} />}
              title="Stream Anywhere"
              description="HLS adaptive streaming means your audio plays smoothly on any connection — mobile data or Wi-Fi."
            />
            <FeatureCard
              icon={<Download size={24} />}
              title="Offline Playback"
              description="Download tracks for offline listening. Your audio is encrypted and bound to your device for security."
            />
            <FeatureCard
              icon={<Shield size={24} />}
              title="Encrypted & Secure"
              description="AES-256 encryption with device-bound keys. Your offline library stays private and protected."
            />
            <FeatureCard
              icon={<Radio size={24} />}
              title="Long-Form Audio"
              description="From 1-hour mixes to 6-hour sessions. Built for audio that needs space to breathe."
            />
            <FeatureCard
              icon={<Mic2 size={24} />}
              title="Creator Platform"
              description="Apply to become a creator and share your original audio with the Rhythm Registry community."
            />
            <FeatureCard
              icon={<Lock size={24} />}
              title="App-Only Playback"
              description="Offline tracks can only play within Rhythm Registry. No file sharing, no ripping."
            />
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(136, 19, 55, 0.2) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h2
            className="text-3xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Ready to listen?
          </h2>
          <p
            className="text-base md:text-lg mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            Join Rhythm Registry and start exploring curated original audio
            today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup?role=listener" className="btn btn-primary btn-lg">
              Be a listener
              <ArrowRight size={18} />
            </Link>
            <Link href="/signup?role=creator" className="btn btn-outline btn-lg">
              Be a creator
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer
        className="py-8 px-4 text-center"
        style={{
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "var(--rose-primary)" }}
          >
            <Mic2 size={12} className="text-white" />
          </div>
          <span
            className="text-sm font-semibold"
            style={{
              fontFamily: "var(--font-outfit)",
              color: "var(--text-secondary)",
            }}
          >
            Rhythm Registry
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-disabled)" }}>
          &copy; {new Date().getFullYear()} Rhythm Registry. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card p-6">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: "var(--rose-secondary)",
          color: "var(--rose-light)",
        }}
      >
        {icon}
      </div>
      <h3
        className="text-base font-semibold mb-2"
        style={{
          fontFamily: "var(--font-outfit)",
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
    </div>
  );
}
