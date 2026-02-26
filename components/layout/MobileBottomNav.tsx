"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, ClipboardList, Upload, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: ("admin" | "creator" | "listener")[];
}

const navItems: BottomNavItem[] = [
  { href: "/dashboard", label: "Home", icon: <Home size={22} /> },
  { href: "/dashboard/search", label: "Search", icon: <Search size={22} /> },
  { href: "/dashboard/library", label: "Library", icon: <Library size={22} /> },
  {
    href: "/dashboard/orders",
    label: "Orders",
    icon: <ClipboardList size={22} />,
    roles: ["listener"],
  },
  {
    href: "/dashboard/upload",
    label: "Upload",
    icon: <Upload size={22} />,
    roles: ["creator", "admin"],
  },
  {
    href: "/dashboard/admin",
    label: "Admin",
    icon: <ShieldCheck size={22} />,
    roles: ["admin"],
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        height: "var(--mobile-nav-height)",
        background: "rgba(18, 18, 18, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
      }}>
      <div className="flex items-center justify-around h-full px-2">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-0"
              style={{
                textDecoration: "none",
                color: isActive ? "var(--rose-light)" : "var(--text-muted)",
                transition: "color var(--transition-fast)",
              }}>
              <span className="relative">
                {item.icon}
                {isActive && (
                  <span
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "var(--rose-light)" }}
                  />
                )}
              </span>
              <span
                className="text-[0.625rem] font-medium truncate max-w-full"
                style={{ lineHeight: 1.2 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
