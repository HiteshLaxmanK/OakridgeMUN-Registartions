"use client";

import { useEffect, useState } from "react";
import type { CommitteeProgress } from "@/lib/types";

export default function CommitteeProgressList({
  committees,
  selected,
  onSelect,
}: {
  committees: CommitteeProgress[];
  selected?: string;
  onSelect?: (committee: string) => void;
}) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => setRole(data.role))
      .catch(() => setRole(null));
  }, []);

  const isAdmin = role === "admin";

  return (
    <div className="rounded-2xl border border-warm-white/10 bg-navy shadow-lg shadow-navy/40 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-lg">Committee Progress</h2>
        <div className="flex items-center gap-4">
          {isAdmin && committees.length > 0 && (
            <a
              href="/api/export"
              className="text-xs font-semibold text-teal hover:underline"
            >
              Export All (.xlsx)
            </a>
          )}
          {selected && (
            <button
              onClick={() => onSelect?.("")}
              className="text-xs font-semibold text-teal hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {committees.map((c) => {
          const pct = c.total > 0 ? Math.round((c.checkedIn / c.total) * 100) : 0;
          const isSelected = selected === c.committee;
          return (
            <div key={c.committee} className="flex items-center gap-2">
              <button
                onClick={() => onSelect?.(isSelected ? "" : c.committee)}
                className={`block flex-1 min-w-0 text-left rounded-lg px-2 py-1.5 -mx-2 transition-colors ${
                  isSelected ? "bg-teal/10" : "hover:bg-warm-white/[0.04]"
                }`}
              >
                <div className="flex justify-between text-sm mb-1.5">
                  <span
                    className={`font-semibold ${isSelected ? "text-teal" : ""}`}
                  >
                    {c.committee}
                  </span>
                  <span className="text-warm-white/50 tabular-nums">
                    {c.checkedIn} / {c.total}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-warm-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
              {isAdmin && (
                <a
                  href={`/api/export?committee=${encodeURIComponent(c.committee)}`}
                  title={`Download ${c.committee} as Excel`}
                  className="shrink-0 rounded-lg p-2 text-warm-white/40 hover:text-teal hover:bg-warm-white/[0.06] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5v9M4 7l4 4 4-4M2.5 13.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
            </div>
          );
        })}
        {committees.length === 0 && (
          <p className="text-warm-white/30 text-sm">No committees yet.</p>
        )}
      </div>
    </div>
  );
}
