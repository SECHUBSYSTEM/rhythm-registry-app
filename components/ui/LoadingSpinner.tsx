"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 40,
};

export default function LoadingSpinner({
  size = "md",
  label,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        size={sizeMap[size]}
        className="animate-spin"
        style={{ color: "var(--rose-primary)" }}
      />
      {label && (
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}
