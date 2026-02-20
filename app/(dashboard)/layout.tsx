"use client";

import { AudioPlayerProvider } from "@/components/providers/AudioPlayerProvider";
import { OfflineProvider } from "@/components/providers/OfflineProvider";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import AudioPlayer from "@/components/audio/AudioPlayer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OfflineProvider>
      <AudioPlayerProvider>
          <div
            className="min-h-screen"
            style={{ background: "var(--bg-base)" }}>
            {/* Top navbar */}
            <Navbar />

            {/* Sidebar (desktop) */}
            <Sidebar />

            {/* Main content */}
            <main
              style={{
                minHeight: "100dvh",
              }}
              className="pt-(--navbar-height) pb-[calc(var(--player-height)+var(--mobile-nav-height))] md:pb-(--player-height) md:pl-(--sidebar-width) transition-[padding]">
              <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
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
