"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Library,
  ClipboardList,
  Briefcase,
  Upload,
  ShieldCheck,
  Music2,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: ("admin" | "creator" | "listener")[];
}

const sidebarLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Home", icon: <Home size={20} /> },
  {
    href: "/dashboard/library",
    label: "Your Library",
    icon: <Library size={20} />,
  },
  {
    href: "/dashboard/orders",
    label: "My orders",
    icon: <ClipboardList size={20} />,
    roles: ["listener"],
  },
  {
    href: "/dashboard/assignments",
    label: "Assignments",
    icon: <Briefcase size={20} />,
    roles: ["creator", "admin"],
  },
  {
    href: "/dashboard/upload",
    label: "Upload",
    icon: <Upload size={20} />,
    roles: ["creator", "admin"],
  },
  {
    href: "/dashboard/admin",
    label: "Admin Panel",
    icon: <ShieldCheck size={20} />,
    roles: ["admin"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();

  const visibleLinks = sidebarLinks.filter(
    (link) => !link.roles || link.roles.includes(role),
  );

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 z-30 overflow-y-auto"
      style={{
        width: "var(--sidebar-width)",
        top: "var(--navbar-height)",
        bottom: 0,
        paddingBottom: "var(--player-height)",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
      }}>
      {/* Brand accent */}
      <div className="p-4 pb-2">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "var(--bg-elevated)" }}>
          <Music2 size={18} style={{ color: "var(--rose-primary)" }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}>
            Navigate
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {visibleLinks.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    color: isActive
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    background: isActive
                      ? "var(--bg-highlight)"
                      : "transparent",
                    textDecoration: "none",
                    ...(isActive && {
                      boxShadow: "inset 3px 0 0 var(--rose-primary)",
                    }),
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--bg-elevated)";
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--text-secondary)";
                    }
                  }}>
                  <span
                    style={{
                      color: isActive
                        ? "var(--rose-light)"
                        : "var(--text-muted)",
                    }}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom decoration */}
      <div className="p-4">
        <div
          className="rounded-xl p-4"
          style={{
            background:
              "linear-gradient(135deg, var(--rose-dark), var(--bg-elevated))",
            border: "1px solid var(--border-subtle)",
          }}>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "var(--text-primary)" }}>
            Rhythm Registry
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Discover · Stream · Download
          </p>
        </div>
      </div>
    </aside>
  );
}
