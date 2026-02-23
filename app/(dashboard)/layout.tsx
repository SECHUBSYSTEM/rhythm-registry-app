"use client";

import { AudioPlayerProvider } from "@/components/providers/AudioPlayerProvider";
import { OfflineProvider } from "@/components/providers/OfflineProvider";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import AudioPlayer from "@/components/audio/AudioPlayer";
import OfflineBanner from "@/components/layout/OfflineBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OfflineProvider>
      <AudioPlayerProvider>
        <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
          <OfflineBanner />
          {/* Top navbar */}
          <Navbar />

          {/* Sidebar (desktop) */}
          <Sidebar />

          {/* Main content */}
          <main
            style={{ minHeight: "100dvh" }}
            className="pt-(--navbar-height) pb-[calc(var(--player-height)+var(--mobile-nav-height))] md:pb-(--player-height) md:pl-(--sidebar-width) transition-[padding] overflow-x-hidden">
            <div className="w-full min-w-0 max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
              {children}
            </div>
          </main>

          {/* Persistent audio player */}
          <AudioPlayer />

          {/* Mobile bottom nav */}
          <MobileBottomNav />
        </div>
      </AudioPlayerProvider>
    </OfflineProvider>
  );
}
