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
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Delegate[]>([]);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
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
        setResults((data.delegates || []).slice(0, 8));
        setSearchError(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Delegate search failed", err);
        setResults([]);
        setSearchError(true);
      }
    }, 150);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [q]);

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
              <p className="font-bold text-lg flex items-center justify-between">
                {d.name}
                {d.checkedIn ? (
                  <span className="text-xs font-semibold text-teal">
                    ✓ Checked In{readOnly && d.checkedInMethod ? ` (${d.checkedInMethod === "qr" ? "QR" : "Manual"})` : ""}
                  </span>
                ) : (
                  readOnly && (
                    <span className="text-xs font-semibold text-warm-white/30">
                      Not checked in
                    </span>
                  )
                )}
              </p>
              <p className="text-warm-white/50 text-sm">
                {d.school} · {d.committee} · {d.country}
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
              className="w-full text-left rounded-xl bg-warm-white/[0.04] hover:bg-teal/15 border border-warm-white/10 hover:border-teal/40 px-5 py-4 transition-colors"
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
      </div>
    </div>
  );
}
