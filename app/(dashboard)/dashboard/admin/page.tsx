"use client";

import { useState, useEffect, useCallback } from "react";
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
  ClipboardList,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import type { CreatorApplication, ApplicationStatus, ListenerOrder } from "@/types";

type TabFilter = "pending" | "approved" | "rejected" | "all";
type AdminSection = "applications" | "orders" | "delete-track";

interface CreatorOption {
  id: string;
  displayName: string;
}

function fetchApplications(): Promise<CreatorApplication[]> {
  return api
    .get<CreatorApplication[]>("/api/admin/creator-applications")
    .then((r) => (Array.isArray(r.data) ? r.data : []))
    .catch(() => []);
}

export default function AdminPage() {
  const { role } = useAuth();
  const [section, setSection] = useState<AdminSection>("applications");
  const [activeTab, setActiveTab] = useState<TabFilter>("pending");
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [orders, setOrders] = useState<ListenerOrder[]>([]);
  const [creators, setCreators] = useState<CreatorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [assignCreatorId, setAssignCreatorId] = useState<Record<string, string>>({});
  const [deleteTrackId, setDeleteTrackId] = useState("");
  const [deletingTrack, setDeletingTrack] = useState(false);
  const [deleteTrackError, setDeleteTrackError] = useState("");

  const fetchOrders = useCallback(() => {
    setOrdersLoading(true);
    api
      .get<ListenerOrder[]>("/api/admin/orders")
      .then((r) => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, []);

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

  useEffect(() => {
    if (role === "admin" && section === "orders") {
      fetchOrders();
      api
        .get<CreatorOption[]>("/api/admin/creators")
        .then((r) => setCreators(Array.isArray(r.data) ? r.data : []))
        .catch(() => setCreators([]));
    }
  }, [role, section, fetchOrders]);

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

  if (loading && section === "applications") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner size="lg" label="Loading applications..." />
      </div>
    );
  }

  const sectionTabs: { value: AdminSection; label: string; icon: React.ReactNode }[] = [
    { value: "applications", label: "Creator applications", icon: <ShieldCheck size={18} /> },
    { value: "orders", label: "Orders", icon: <ClipboardList size={18} /> },
    { value: "delete-track", label: "Delete track", icon: <Trash2 size={18} /> },
  ];

  const filteredApps = applications.filter((app) => {
    const matchesTab = activeTab === "all" || app.status === activeTab;
    const name = (app.userName ?? "").toLowerCase();
    const email = (app.userEmail ?? "").toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery || name.includes(q) || email.includes(q);
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
              {section === "applications" && "Manage creator applications"}
              {section === "orders" && "Assign creators to orders"}
              {section === "delete-track" && "Delete a track and its file"}
            </p>
          </div>
        </div>

        {section === "applications" && (
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
        )}
      </div>

      {/* Section switcher */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
        style={{ background: "var(--bg-elevated)" }}>
        {sectionTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSection(tab.value)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: section === tab.value ? "var(--bg-highlight)" : "transparent",
              color: section === tab.value ? "var(--text-primary)" : "var(--text-muted)",
            }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {section === "orders" && (
        <>
          {ordersLoading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <LoadingSpinner size="lg" label="Loading orders..." />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm py-8" style={{ color: "var(--text-muted)" }}>
              No orders yet.
            </p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                  }}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {order.eventType} — {order.eventDate}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      ID: {order.id.slice(0, 8)}…
                      {order.assignedCreatorId
                        ? order.status === "ASSIGNMENT_PENDING" || order.status === "ASSIGNED"
                          ? ` · Pending (${order.assignedCreatorId.slice(0, 8)}…)`
                          : ` · Accepted (${order.assignedCreatorId.slice(0, 8)}…)`
                        : " · Unassigned"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {order.status !== "ASSIGNMENT_PENDING" &&
                    order.status !== "ASSIGNED" &&
                    order.assignedCreatorId ? (
                      <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        Creator working
                      </span>
                    ) : (
                      <>
                        <select
                          value={assignCreatorId[order.id] ?? ""}
                          onChange={(e) =>
                            setAssignCreatorId((prev) => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          className="input text-sm"
                          style={{
                            background: "var(--bg-base)",
                            color: "var(--text-primary)",
                            borderColor: "var(--border)",
                            minWidth: "140px",
                          }}>
                          <option value="">Select creator</option>
                          {creators.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.displayName}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!assignCreatorId[order.id] || assigningOrderId === order.id}
                      onClick={async () => {
                        const creatorId = assignCreatorId[order.id];
                        if (!creatorId) return;
                        setAssigningOrderId(order.id);
                        try {
                          await api.post(`/api/admin/orders/${order.id}/assign`, {
                            creatorId,
                          });
                          fetchOrders();
                          setAssignCreatorId((prev) => {
                            const next = { ...prev };
                            delete next[order.id];
                            return next;
                          });
                        } finally {
                          setAssigningOrderId(null);
                        }
                      }}
                      className="btn btn-sm inline-flex items-center gap-1">
                      {assigningOrderId === order.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <UserPlus size={14} />
                          {order.assignedCreatorId && (order.status === "ASSIGNMENT_PENDING" || order.status === "ASSIGNED") ? "Reassign" : "Assign"}
                        </>
                      )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {section === "delete-track" && (
        <div
          className="rounded-xl border p-6 max-w-md"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Permanently delete a track and its audio file. Enter the track ID (UUID).
          </p>
          <input
            type="text"
            value={deleteTrackId}
            onChange={(e) => {
              setDeleteTrackId(e.target.value);
              setDeleteTrackError("");
            }}
            placeholder="Track ID (e.g. from library URL)"
            className="input w-full mb-3"
            style={{
              background: "var(--bg-base)",
              color: "var(--text-primary)",
              borderColor: "var(--border)",
            }}
          />
          {deleteTrackError && (
            <p className="text-sm mb-2" style={{ color: "var(--rose-primary)" }}>
              {deleteTrackError}
            </p>
          )}
          <button
            type="button"
            disabled={!deleteTrackId.trim() || deletingTrack}
            onClick={async () => {
              const id = deleteTrackId.trim();
              if (!id) return;
              setDeletingTrack(true);
              setDeleteTrackError("");
              try {
                await api.delete(`/api/admin/tracks/${id}`);
                setDeleteTrackId("");
              } catch (err: unknown) {
                const res =
                  err && typeof err === "object" && "response" in err
                    ? (err as { response?: { data?: { error?: string } } }).response
                    : null;
                setDeleteTrackError(res?.data?.error ?? "Failed to delete track.");
              } finally {
                setDeletingTrack(false);
              }
            }}
            className="btn border"
            style={{
              borderColor: "var(--rose-primary)",
              color: "var(--rose-primary)",
            }}>
            {deletingTrack ? <LoadingSpinner size="sm" /> : <Trash2 size={16} />}
            Delete track
          </button>
        </div>
      )}

      {section === "applications" && (
      <>
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
                    {(app.userName ?? "?")[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}>
                      {app.userName ?? "—"}
                    </p>
                    <p
                      className="text-xs flex items-center gap-1"
                      style={{ color: "var(--text-muted)" }}>
                      <Mail size={11} />
                      {app.userEmail ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Status badge */}
                <StatusBadge status={app.status ?? "pending"} />
              </div>

              {/* Bio */}
              <p
                className="text-sm leading-relaxed mb-3"
                style={{ color: "var(--text-secondary)" }}>
                {app.bio ?? "—"}
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
      </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const safeStatus = status ?? "pending";
  const config: Record<
    ApplicationStatus,
    { icon: React.ReactNode; className: string; label: string }
  > = {
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

  const c = config[safeStatus] ?? config.pending;
  return (
    <span className={`badge ${c.className}`}>
      {c.icon}
      {c.label}
    </span>
  );
}
