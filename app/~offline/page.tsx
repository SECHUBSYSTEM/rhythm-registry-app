"use client";

import { WifiOff, RefreshCw, Music } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div
        className="flex items-center justify-center w-16 h-16 rounded-full mb-6"
        style={{ background: "var(--bg-highlight)" }}>
        <WifiOff size={32} className="text-gray-400" />
      </div>
      <h1 className="text-xl font-semibold mb-2">You&apos;re offline</h1>
      <p className="text-sm text-gray-400 max-w-sm mb-8">
        Check your connection and try again. You can still play any tracks you
        downloaded for offline listening.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard/library"
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
          style={{
            background: "var(--accent)",
            color: "var(--bg-base)",
          }}>
          <Music size={18} />
          My library
        </Link>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium border transition-colors"
          style={{
            borderColor: "var(--border-strong)",
            color: "var(--text-primary)",
          }}>
          <RefreshCw size={18} />
          Try again
        </button>
      </div>
    </div>
  );
}
