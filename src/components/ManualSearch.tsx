"use client";

import { useEffect, useState } from "react";
import type { Delegate } from "@/lib/types";

export default function ManualSearch({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Delegate[]>([]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/delegates?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults((data.delegates || []).slice(0, 8));
    }, 150);
    return () => clearTimeout(handle);
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
        {results.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className="w-full text-left rounded-xl bg-warm-white/[0.04] hover:bg-teal/15 border border-warm-white/10 hover:border-teal/40 px-5 py-4 transition-colors"
          >
            <p className="font-bold text-lg flex items-center justify-between">
              {d.name}
              {d.checkedIn && (
                <span className="text-xs font-semibold text-teal">✓ Checked In</span>
              )}
            </p>
            <p className="text-warm-white/50 text-sm">
              {d.school} · {d.committee} · {d.country}
            </p>
          </button>
        ))}
        {q.trim() && results.length === 0 && (
          <p className="text-warm-white/30 text-center py-4">No delegates found.</p>
        )}
      </div>
    </div>
  );
}
