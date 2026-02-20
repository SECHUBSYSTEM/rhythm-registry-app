"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import TrackList from "@/components/tracks/TrackList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import type { SearchResult } from "@/types";
import { Search } from "lucide-react";

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({
    tracks: [],
    total: 0,
    query: "",
  });

  // Debounced API search
  useEffect(() => {
    if (!searchInput.trim()) {
      queueMicrotask(() => {
        setResults({ tracks: [], total: 0, query: "" });
        setLoading(false);
      });
      return;
    }

    queueMicrotask(() => setLoading(true));
    const timer = setTimeout(() => {
      router.replace(`/dashboard/search?q=${encodeURIComponent(searchInput)}`, {
        scroll: false,
      });

      api
        .get<SearchResult>("/api/search", {
          params: { q: searchInput },
        })
        .then((res) => setResults(res.data))
        .catch(() => setResults({ tracks: [], total: 0, query: searchInput }))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, router]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search input – always visible */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          type="text"
          placeholder="Search tracks, creators..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="input pl-12"
          autoFocus
          style={{
            borderRadius: "var(--radius-full)",
            height: "48px",
            fontSize: "0.9375rem",
            background: "var(--bg-elevated)",
          }}
        />
      </div>

      {/* Empty state (no input yet) */}
      {!searchInput.trim() && (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center px-4">
          <div className="bg-[var(--bg-highlight)] p-4 rounded-full mb-4">
            <Search size={32} className="text-[var(--text-muted)]" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">
            Search Rhythm Registry
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Find your favourite tracks, artists, and mixes.
          </p>
        </div>
      )}

      {/* Loading state */}
      {searchInput.trim() && loading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* Results */}
      {searchInput.trim() && !loading && (
        <>
          <p className="text-sm text-[var(--text-muted)]">
            {results.total} result
            {results.total !== 1 ? "s" : ""}
          </p>

          {results.tracks.length > 0 ? (
            <TrackList tracks={results.tracks} variant="compact" />
          ) : (
            <div className="text-center py-12 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
              <p className="text-[var(--text-muted)]">
                No tracks found matching &quot;{searchInput}&quot;
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Suspense
        fallback={
          <div className="p-8 text-[var(--text-muted)]">Loading search...</div>
        }>
        <SearchResults />
      </Suspense>
    </div>
  );
}
