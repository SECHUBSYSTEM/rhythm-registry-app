"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Briefcase } from "lucide-react";
import api from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { ListenerOrder } from "@/types";

function statusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<ListenerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ListenerOrder[]>("/api/creator/assignments")
      .then((res) => setAssignments(res.data ?? []))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner size="lg" label="Loading assignments..." />
      </div>
    );
  }

  return (
    <div className="py-8 animate-fade-in-up">
      <h1
        className="text-2xl font-bold mb-6"
        style={{
          fontFamily: "var(--font-outfit)",
          color: "var(--text-primary)",
        }}>
        My assignments
      </h1>

      {assignments.length === 0 ? (
        <div
          className="rounded-xl border p-8 text-center"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}>
          <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-60" />
          <p>No assignments yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {assignments.map((order) => (
            <li key={order.id}>
              <Link
                href={`/dashboard/assignments/${order.id}`}
                className="block rounded-xl border p-4 transition-colors hover:opacity-90"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p
                      className="font-medium truncate"
                      style={{ color: "var(--text-primary)" }}>
                      {order.eventType} — {order.eventDate}
                    </p>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--text-muted)" }}>
                      {order.durationHours}h
                    </p>
                    <span
                      className="inline-block mt-2 text-xs px-2 py-0.5 rounded"
                      style={{
                        background: "var(--bg-base)",
                        color: "var(--text-secondary)",
                      }}>
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <ChevronRight
                    className="w-5 h-5 shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
