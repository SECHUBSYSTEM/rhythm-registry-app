"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Mic2,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      setMobileMenuOpen(false);
    }
  };

  const isDashboard = pathname.startsWith("/dashboard");

  const roleBadge =
    role === "admin" ? "Admin" : role === "creator" ? "Creator" : null;

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          height: "var(--navbar-height)",
          background: "rgba(10, 10, 10, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
        <div className="flex items-center justify-between h-full px-4 md:px-6 max-w-[1600px] mx-auto">
          {/* Logo */}
          <Link
            href={isDashboard ? "/dashboard" : "/"}
            className="flex items-center gap-2 shrink-0"
            style={{ textDecoration: "none" }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--rose-primary)" }}>
              <Mic2 size={18} className="text-white" />
            </div>
            <span
              className="text-lg font-bold hidden sm:block"
              style={{
                fontFamily: "var(--font-outfit)",
                color: "var(--text-primary)",
              }}>
              Rhythm Registry
            </span>
          </Link>

          {/* Search (Dashboard only, hidden on mobile) */}
          {isDashboard && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="text"
                  placeholder="Search tracks, creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="input pl-10"
                  style={{
                    borderRadius: "var(--radius-full)",
                    height: "40px",
                    fontSize: "0.8125rem",
                    background: "var(--bg-highlight)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {roleBadge && (
              <span className="badge badge-rose hidden sm:inline-flex">
                <Shield size={10} />
                {roleBadge}
              </span>
            )}

            {/* Profile dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 btn-ghost rounded-full px-2 py-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "var(--bg-highlight)",
                      color: "var(--text-primary)",
                    }}>
                    {user.displayName?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <ChevronDown
                    size={14}
                    className="hidden sm:block"
                    style={{
                      color: "var(--text-muted)",
                      transition: "transform var(--transition-fast)",
                      transform: profileMenuOpen
                        ? "rotate(180deg)"
                        : "rotate(0)",
                    }}
                  />
                </button>

                {/* Dropdown menu */}
                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 top-full mt-2 w-56 py-2 z-50 animate-scale-in glass-card-static"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-default)",
                        borderRadius: "var(--radius-lg)",
                        boxShadow: "var(--shadow-lg)",
                      }}>
                      <div
                        className="px-4 py-2 border-b"
                        style={{ borderColor: "var(--border-subtle)" }}>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}>
                          {user.displayName}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}>
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-bg-highlight transition-colors"
                        style={{
                          color: "var(--text-secondary)",
                          textDecoration: "none",
                        }}
                        onClick={() => setProfileMenuOpen(false)}>
                        <User size={14} />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-bg-highlight transition-colors"
                        style={{
                          color: "var(--text-secondary)",
                          background: "none",
                          border: "none",
                        }}>
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn btn-ghost text-sm">
                  Log in
                </Link>
                <Link href="/signup" className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="btn-ghost p-2 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu">
              {mobileMenuOpen ? (
                <X size={22} style={{ color: "var(--text-primary)" }} />
              ) : (
                <Menu size={22} style={{ color: "var(--text-primary)" }} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-out menu – rendered OUTSIDE <nav> to avoid stacking context trap */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden animate-mobile-menu-backdrop"
            style={{ background: "rgba(0, 0, 0, 0.6)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="fixed right-0 bottom-0 w-72 z-50 md:hidden animate-mobile-menu-in overflow-y-auto"
            style={{
              top: "64px",
              background: "var(--bg-surface)",
              borderLeft: "1px solid var(--border-subtle)",
            }}>
            {/* Mobile search */}
            {isDashboard && (
              <div className="p-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    className="input pl-10"
                    style={{
                      borderRadius: "var(--radius-full)",
                      height: "40px",
                      fontSize: "0.8125rem",
                    }}
                  />
                </div>
              </div>
            )}

            <div
              className="border-t"
              style={{ borderColor: "var(--border-subtle)" }}>
              <MobileNavLink
                href="/dashboard"
                label="Home"
                active={pathname === "/dashboard"}
                onClick={() => setMobileMenuOpen(false)}
              />
              <MobileNavLink
                href="/dashboard/library"
                label="Library"
                active={pathname === "/dashboard/library"}
                onClick={() => setMobileMenuOpen(false)}
              />
              {(role === "creator" || role === "admin") && (
                <>
                  <MobileNavLink
                    href="/dashboard/upload"
                    label="Upload"
                    active={pathname === "/dashboard/upload"}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                </>
              )}
              {role === "listener" && (
                <MobileNavLink
                  href="/dashboard/become-creator"
                  label="Become a Creator"
                  active={pathname === "/dashboard/become-creator"}
                  onClick={() => setMobileMenuOpen(false)}
                />
              )}
              {role === "admin" && (
                <MobileNavLink
                  href="/dashboard/admin"
                  label="Admin Panel"
                  active={pathname === "/dashboard/admin"}
                  onClick={() => setMobileMenuOpen(false)}
                />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MobileNavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-6 py-3 text-sm font-medium transition-colors"
      style={{
        color: active ? "var(--rose-light)" : "var(--text-secondary)",
        background: active ? "var(--rose-secondary)" : "transparent",
        textDecoration: "none",
      }}>
      {label}
    </Link>
  );
}
