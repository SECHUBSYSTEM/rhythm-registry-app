"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AudioPlayerProvider } from "@/components/providers/AudioPlayerProvider";
import { OfflineProvider } from "@/components/providers/OfflineProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { getRedirectForUser, SIGN_OUT_REDIRECT } from "@/lib/auth/redirects";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import AudioPlayer from "@/components/audio/AudioPlayer";
import OfflineBanner from "@/components/layout/OfflineBanner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signupRole, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      const current = pathname || "/dashboard";
      const loginUrl = "/login?next=" + encodeURIComponent(current);
      if (pathname !== "/login") {
        router.replace(loginUrl);
      }
      return;
    }

    const redirect = getRedirectForUser(user, signupRole, pathname || "");

    if (redirect === SIGN_OUT_REDIRECT) {
      logout();
      return;
    }

    if (redirect && redirect !== pathname) {
      router.replace(redirect);
    }
  }, [isLoading, user, signupRole, pathname, router, logout]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <LoadingSpinner />
      </div>
    );
  }

  const redirect = getRedirectForUser(user, signupRole, pathname || "");
  if (redirect === SIGN_OUT_REDIRECT || (redirect && redirect !== pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <LoadingSpinner />
      </div>
    );
  }

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
