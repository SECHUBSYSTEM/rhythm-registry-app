"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Music, Calendar, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { ListenerOrder } from "@/types";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 30;

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [orders, setOrders] = useState<ListenerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(!!sessionId);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get<ListenerOrder[]>("/api/listener/orders");
      setOrders(data ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      fetchOrders();
      return;
    }

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data } = await api.get<{ order: ListenerOrder | null }>(
          `/api/listener/orders/by-session?session_id=${encodeURIComponent(sessionId)}`
        );
        if (data?.order) {
          setPolling(false);
          router.replace(`/dashboard/orders/${data.order.id}`);
          return;
        }
      } catch {
        // ignore
      }
      if (attempts >= POLL_MAX_ATTEMPTS) {
        setPolling(false);
        fetchOrders();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [sessionId, router, fetchOrders]);

  if (polling) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <LoadingSpinner size="lg" label="Confirming your order..." />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Please wait while we confirm your order...
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner size="lg" label="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="py-8 animate-fade-in-up">
      <h1
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>
        My orders
      </h1>

      {orders.length === 0 ? (
        <div
          className="rounded-xl border p-8 text-center"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}>
          <Music className="w-12 h-12 mx-auto mb-4 opacity-60" />
          <p className="mb-4">No orders yet.</p>
          <Link
            href="/dashboard/onboarding"
            className="btn btn-primary">
            Get your custom mix
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/dashboard/orders/${order.id}`}
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
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                      {order.durationHours}h
                      {order.rush ? " · Rush" : ""}
                      {" · "}
                      {formatCents(order.totalAmountCents)}
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
