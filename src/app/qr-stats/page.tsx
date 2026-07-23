"use client";

import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/StatCard";
import type { QrLookupStats } from "@/lib/db";

type ResultFilter = "all" | "found" | "not_found";

export default function QrStatsPage() {
  const [stats, setStats] = useState<QrLookupStats | null>(null);
  const [q, setQ] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [repeatedOnly, setRepeatedOnly] = useState(false);

  useEffect(() => {
    fetch("/api/qr-stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const attemptCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of stats?.lookups || []) {
      const key = l.email.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [stats]);

  const filtered = useMemo(() => {
    if (!stats) return [];
    const query = q.trim().toLowerCase();
    return stats.lookups.filter((l) => {
      if (query && !l.email.toLowerCase().includes(query)) return false;
      if (resultFilter === "found" && !l.found) return false;
      if (resultFilter === "not_found" && l.found) return false;
      if (repeatedOnly && (attemptCounts.get(l.email.toLowerCase()) || 0) < 2) return false;
      return true;
    });
  }, [stats, q, resultFilter, repeatedOnly, attemptCounts]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">QR Code Lookups</h1>
        <p className="text-warm-white/50">
          Every email that asked for a QR code on oakridgemun.in.
        </p>
      </div>

      {!stats ? (
        <p className="text-warm-white/40 text-center">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Lookups" value={stats.totalLookups} />
            <StatCard label="Unique Emails" value={stats.uniqueEmails} accent="gold" />
            <StatCard label="Matched" value={stats.foundCount} accent="teal" />
            <StatCard label="Not Found" value={stats.notFoundCount} accent="red" />
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by email..."
              className="flex-1 min-w-[200px] rounded-xl bg-warm-white/[0.06] border border-warm-white/15 px-4 py-2.5 text-sm placeholder:text-warm-white/30 focus:outline-none focus:border-teal/60"
            />
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as ResultFilter)}
              className="rounded-xl bg-warm-white/[0.06] border border-warm-white/15 px-4 py-2.5 text-sm focus:outline-none focus:border-teal/60"
            >
              <option value="all">All Results</option>
              <option value="found">Found Only</option>
              <option value="not_found">Not Found Only</option>
            </select>
            <button
              onClick={() => setRepeatedOnly((v) => !v)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold border transition-colors ${
                repeatedOnly
                  ? "bg-teal text-navy border-teal"
                  : "bg-warm-white/[0.06] border-warm-white/15 text-warm-white/70 hover:bg-warm-white/[0.1]"
              }`}
            >
              Repeated Attempts Only
            </button>
            {(q || resultFilter !== "all" || repeatedOnly) && (
              <button
                onClick={() => {
                  setQ("");
                  setResultFilter("all");
                  setRepeatedOnly(false);
                }}
                className="text-xs font-semibold text-teal hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <p className="text-xs text-warm-white/40 mb-3">
            Showing {filtered.length} of {stats.lookups.length} lookups
          </p>

          <div className="rounded-2xl border border-warm-white/10 bg-navy shadow-lg shadow-navy/40 overflow-hidden">
            <div className="max-h-[560px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-navy border-b border-warm-white/10">
                  <tr className="text-left text-warm-white/40 uppercase text-xs tracking-widest">
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Result</th>
                    <th className="px-5 py-3 font-semibold">Attempts</th>
                    <th className="px-5 py-3 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => {
                    const count = attemptCounts.get(l.email.toLowerCase()) || 1;
                    return (
                      <tr key={l.id} className="border-b border-warm-white/5 last:border-0">
                        <td className="px-5 py-3">{l.email}</td>
                        <td className="px-5 py-3">
                          {l.found ? (
                            <span className="text-teal font-semibold">Found</span>
                          ) : (
                            <span className="text-bright-red/80 font-semibold">Not Found</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-warm-white/50">
                          {count > 1 ? (
                            <span className="text-warm-gold font-semibold">{count}x</span>
                          ) : (
                            "1x"
                          )}
                        </td>
                        <td className="px-5 py-3 text-warm-white/50">
                          {new Date(l.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-warm-white/30">
                        No lookups match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
