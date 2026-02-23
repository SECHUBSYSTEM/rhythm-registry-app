"use client";

import { useEffect, useState, useRef } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }
    if (!wasOffline.current) return;
    // Defer setState so it's not synchronous in effect body (avoids cascading renders)
    const showId = setTimeout(() => setShowBackOnline(true), 0);
    const hideId = setTimeout(() => {
      setShowBackOnline(false);
      wasOffline.current = false;
    }, 3000);
    return () => {
      clearTimeout(showId);
      clearTimeout(hideId);
    };
  }, [isOnline]);

  if (isOnline && !showBackOnline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-100 flex justify-center w-full pointer-events-none transition-all duration-500 ease-in-out ${
        !isOnline || showBackOnline
          ? "translate-y-4 opacity-100"
          : "-translate-y-full opacity-0"
      }`}>
      <div
        className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md"
        style={{
          background: !isOnline
            ? "rgba(18, 18, 18, 0.95)"
            : "rgba(29, 185, 84, 0.95)",
          border: `1px solid ${
            !isOnline ? "var(--border-strong)" : "rgba(255,255,255,0.2)"
          }`,
        }}>
        {!isOnline ? (
          <>
            <WifiOff size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-200">
              You are offline. Playing downloaded tracks only.
            </span>
          </>
        ) : (
          <>
            <Wifi size={16} className="text-white" />
            <span className="text-sm font-medium text-white">Back online</span>
          </>
        )}
      </div>
    </div>
  );
}
