import { Mic2 } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      {/* Left: Form side */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        {/* Header */}
        <div className="p-4 md:p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2"
            style={{ textDecoration: "none" }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--rose-primary)" }}>
              <Mic2 size={18} className="text-white" />
            </div>
            <span
              className="text-lg font-bold"
              style={{
                fontFamily: "var(--font-outfit)",
                color: "var(--text-primary)",
              }}>
              Rhythm Registry
            </span>
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      {/* Right: Decorative panel (desktop only) */}
      <div
        className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--rose-dark) 0%, var(--bg-base) 50%, var(--rose-primary) 100%)",
        }}>
        {/* Background orbs */}
        <div
          className="absolute w-80 h-80 rounded-full animate-float opacity-20"
          style={{
            background:
              "radial-gradient(circle, var(--rose-light), transparent)",
            top: "20%",
            right: "10%",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute w-60 h-60 rounded-full animate-float opacity-15"
          style={{
            background: "radial-gradient(circle, white, transparent)",
            bottom: "25%",
            left: "15%",
            filter: "blur(40px)",
            animationDelay: "2s",
          }}
        />

        {/* Centre content */}
        <div className="relative z-10 text-center px-8 max-w-sm">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}>
            <Mic2 size={36} className="text-white" />
          </div>
          <h2
            className="text-2xl font-bold mb-3 text-white"
            style={{ fontFamily: "var(--font-outfit)" }}>
            Your sound awaits
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Stream original audio, discover new creators, and take your
            favourite tracks offline — all with encrypted, secure playback.
          </p>
        </div>
      </div>
    </div>
  );
}
