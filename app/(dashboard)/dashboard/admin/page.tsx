"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import type { CreatorApplication, ApplicationStatus } from "@/types";

type TabFilter = "pending" | "approved" | "rejected" | "all";

function fetchApplications(): Promise<CreatorApplication[]> {
  return api.get<CreatorApplication[]>("/api/admin/creator-applications").then((r) => r.data ?? []);
}

export default function AdminPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<TabFilter>("pending");
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "admin") {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchApplications()
      .then(setApplications)
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [role]);

  // Access gate
  if (role !== "admin") {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--bg-elevated)" }}>
          <ShieldCheck size={24} style={{ color: "var(--text-muted)" }} />
        </div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ fontFamily: "var(--font-outfit)" }}>
          Admin access required
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner size="lg" label="Loading applications..." />
      </div>
    );
  }

  const filteredApps = applications.filter((app) => {
    const matchesTab = activeTab === "all" || app.status === activeTab;
    const matchesSearch =
      !searchQuery ||
      app.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/api/admin/creator-applications/${id}/approve`);
      const list = await fetchApplications();
      setApplications(list);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/api/admin/creator-applications/${id}/reject`, {
        reason: rejectReason || undefined,
      });
      const list = await fetchApplications();
      setApplications(list);
      setRejectingId(null);
      setRejectReason("");
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { value: TabFilter; label: string; count: number }[] = [
    {
      value: "pending",
      label: "Pending",
      count: applications.filter((a) => a.status === "pending").length,
    },
    {
      value: "approved",
      label: "Approved",
      count: applications.filter((a) => a.status === "approved").length,
    },
    {
      value: "rejected",
      label: "Rejected",
      count: applications.filter((a) => a.status === "rejected").length,
    },
    { value: "all", label: "All", count: applications.length },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "var(--rose-secondary)" }}>
            <ShieldCheck size={22} style={{ color: "var(--rose-light)" }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-outfit)" }}>
              Admin Panel
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Manage creator applications
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            className="input pl-11 text-sm"
            placeholder="Search applicants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              borderRadius: "var(--radius-full)",
              height: "38px",
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto hide-scrollbar"
        style={{ background: "var(--bg-elevated)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background:
                activeTab === tab.value ? "var(--bg-highlight)" : "transparent",
              color:
                activeTab === tab.value
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
            }}>
            {tab.label}
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                background:
                  activeTab === tab.value
                    ? "var(--rose-secondary)"
                    : "var(--bg-highlight)",
                color:
                  activeTab === tab.value
                    ? "var(--rose-light)"
                    : "var(--text-disabled)",
              }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Applications */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-16">
          <Filter
            size={24}
            className="mx-auto mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No applications match your filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="glass-card-static p-4 md:p-5"
              style={{ borderRadius: "var(--radius-xl)" }}>
              {/* Top row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{
                      background: "var(--bg-highlight)",
                      color: "var(--text-primary)",
                    }}>
                    {app.userName[0].toUpperCase()}
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}>
                      {app.userName}
                    </p>
                    <p
                      className="text-xs flex items-center gap-1"
                      style={{ color: "var(--text-muted)" }}>
                      <Mail size={11} />
                      {app.userEmail}
                    </p>
                  </div>
                </div>

                {/* Status badge */}
                <StatusBadge status={app.status} />
              </div>

              {/* Bio */}
              <p
                className="text-sm leading-relaxed mb-3"
                style={{ color: "var(--text-secondary)" }}>
                {app.bio}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="badge badge-neutral capitalize">
                  {app.contentType}
                </span>
                {app.links?.soundcloud && (
                  <a
                    href={app.links.soundcloud}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 transition-colors"
                    style={{ color: "var(--text-muted)" }}>
                    <ExternalLink size={11} />
                    SoundCloud
                  </a>
                )}
                {app.links?.youtube && (
                  <a
                    href={app.links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 transition-colors"
                    style={{ color: "var(--text-muted)" }}>
                    <ExternalLink size={11} />
                    YouTube
                  </a>
                )}
                {app.links?.other && (
                  <a
                    href={app.links.other}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 transition-colors"
                    style={{ color: "var(--text-muted)" }}>
                    <ExternalLink size={11} />
                    Website
                  </a>
                )}
              </div>

              {/* Rejection reason */}
              {app.status === "rejected" && app.rejectionReason && (
                <div
                  className="p-3 rounded-lg mb-3 text-xs"
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    color: "var(--error)",
                  }}>
                  <span className="font-medium">Reason:</span>{" "}
                  {app.rejectionReason}
                </div>
              )}

              {/* Reject reason input */}
              {rejectingId === app.id && (
                <div className="mb-3 animate-fade-in">
                  <textarea
                    className="input text-sm mb-2"
                    rows={2}
                    placeholder="Reason for rejection (optional)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(app.id)}
                      disabled={actionLoading === app.id}
                      className="btn btn-sm"
                      style={{
                        background: "var(--error)",
                        color: "white",
                      }}>
                      {actionLoading === app.id ? (
                        <span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        "Confirm rejection"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      className="btn btn-sm btn-ghost">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Actions (pending only) */}
              {app.status === "pending" && rejectingId !== app.id && (
                <div
                  className="flex gap-2 pt-2 border-t"
                  style={{ borderColor: "var(--border-subtle)" }}>
                  <button
                    onClick={() => handleApprove(app.id)}
                    disabled={actionLoading === app.id}
                    className="btn btn-sm flex-1 sm:flex-none"
                    style={{
                      background: "rgba(29, 185, 84, 0.15)",
                      color: "var(--success)",
                    }}>
                    {actionLoading === app.id ? (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-current/30 border-t-current rounded-full" />
                    ) : (
                      <>
                        <Check size={14} />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setRejectingId(app.id)}
                    className="btn btn-sm flex-1 sm:flex-none"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "var(--error)",
                    }}>
                    <X size={14} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = {
    pending: {
      icon: <Clock size={10} />,
      className: "badge-warning",
      label: "Pending",
    },
    approved: {
      icon: <CheckCircle2 size={10} />,
      className: "badge-success",
      label: "Approved",
    },
    rejected: {
      icon: <XCircle size={10} />,
      className: "badge-error",
      label: "Rejected",
    },
  };

  const c = config[status];
  return (
    <span className={`badge ${c.className}`}>
      {c.icon}
      {c.label}
    </span>
  );
}
