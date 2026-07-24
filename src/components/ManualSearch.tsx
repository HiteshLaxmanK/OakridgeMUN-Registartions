"use client";

import { useEffect, useState } from "react";
import type { Delegate } from "@/lib/types";

export default function ManualSearch({
  onSelect,
  readOnly = false,
}: {
  onSelect?: (id: string) => void;
  readOnly?: boolean;
}) {
  const RESULT_CAP = 10;
  const [q, setQ] = useState("");
  const [allResults, setAllResults] = useState<Delegate[]>([]);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setAllResults([]);
      setSearchError(false);
      return;
    }
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/delegates?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`search failed: ${res.status}`);
        const data = await res.json();
        setAllResults(data.delegates || []);
        setSearchError(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Delegate search failed", err);
        setAllResults([]);
        setSearchError(true);
      }
    }, 150);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [q]);

  // Relevance ranking — the search itself matches name/email/school/
  // committee/country all equally, so without this a last name that
  // happens to contain the query as a substring (e.g. "Kanikanti"
  // matching "anika") ranked ahead of actual people named Anika, since
  // the API just returns rows in table order.
  function relevanceScore(d: Delegate, query: string): number {
    const name = d.name.toLowerCase();
    if (name === query) return 0;
    if (name.startsWith(query)) return 1;
    if (name.split(/\s+/).some((w) => w.startsWith(query))) return 2;
    if (name.includes(query)) return 3;
    const email = d.email.toLowerCase();
    if (email.startsWith(query)) return 4;
    if (email.includes(query)) return 5;
    return 6;
  }

  const query = q.trim().toLowerCase();
  const sorted = [...allResults].sort((a, b) => {
    const rel = relevanceScore(a, query) - relevanceScore(b, query);
    if (rel !== 0) return rel;
    // Within the same relevance tier, not-yet-checked-in first — that's
    // who a registration desk is actually looking for.
    return readOnly ? 0 : Number(a.checkedIn) - Number(b.checkedIn);
  });
  const results = sorted.slice(0, RESULT_CAP);
  const hiddenCount = sorted.length - results.length;

  return (
    <div className="w-full max-w-xl mx-auto">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, school, or country..."
        className="w-full rounded-2xl bg-warm-white/[0.06] border border-warm-white/15 px-6 py-4 text-lg placeholder:text-warm-white/30 focus:outline-none focus:border-teal/60"
      />
      <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
        {results.map((d) => {
          const content = (
            <>
              <p className="font-bold text-lg flex items-center justify-between gap-3">
                <span className="truncate">{d.name}</span>
                {d.checkedIn ? (
                  <span className="text-xs font-semibold text-teal shrink-0">
                    ✓ Checked In{readOnly && d.checkedInMethod ? ` (${d.checkedInMethod === "qr" ? "QR" : "Manual"})` : ""}
                  </span>
                ) : (
                  readOnly && (
                    <span className="text-xs font-semibold text-warm-white/30 shrink-0">
                      Not checked in
                    </span>
                  )
                )}
              </p>
              <p className="text-warm-white/50 text-sm truncate">{d.email}</p>
              <p className="text-warm-white/70 text-sm font-medium">
                {[d.school, d.committee, d.country].filter(Boolean).join(" · ")}
              </p>
              {readOnly && (
                <p className="text-sm mt-1">
                  {d.liabilityFormOnFile ? (
                    <span className="text-teal font-semibold">✓ Liability Form on File</span>
                  ) : (
                    <span className="text-bright-red/80 font-semibold">✕ Liability Form Missing</span>
                  )}
                </p>
              )}
            </>
          );

          if (readOnly) {
            return (
              <div
                key={d.id}
                className="w-full text-left rounded-xl bg-warm-white/[0.04] border border-warm-white/10 px-5 py-4"
              >
                {content}
              </div>
            );
          }

          return (
            <button
              key={d.id}
              onClick={() => onSelect?.(d.id)}
              className={`w-full text-left rounded-xl border px-5 py-4 transition-colors ${
                d.checkedIn
                  ? "bg-warm-white/[0.015] border-warm-white/5 opacity-60 hover:opacity-100 hover:bg-warm-white/[0.04]"
                  : "bg-warm-white/[0.04] border-warm-white/10 hover:bg-teal/15 hover:border-teal/40"
              }`}
            >
              {content}
            </button>
          );
        })}
        {searchError && (
          <p className="text-bright-red font-semibold text-center py-4">
            Search failed — check your connection and try again.
          </p>
        )}
        {!searchError && q.trim() && results.length === 0 && (
          <p className="text-warm-white/30 text-center py-4">No delegates found.</p>
        )}
        {!searchError && hiddenCount > 0 && (
          <p className="text-warm-white/30 text-xs text-center py-2">
            +{hiddenCount} more match{hiddenCount === 1 ? "" : "es"} — keep typing to narrow it down.
          </p>
        )}
      </div>
    </div>
  );
}
