"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import type { QrLookupStats } from "@/lib/db";

export default function QrStatsPage() {
  const [stats, setStats] = useState<QrLookupStats | null>(null);

  useEffect(() => {
    fetch("/api/qr-stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

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

          <div className="rounded-2xl border border-warm-white/10 bg-navy shadow-lg shadow-navy/40 overflow-hidden">
            <div className="max-h-[560px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-navy border-b border-warm-white/10">
                  <tr className="text-left text-warm-white/40 uppercase text-xs tracking-widest">
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Result</th>
                    <th className="px-5 py-3 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lookups.map((l) => (
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
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {stats.lookups.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-warm-white/30">
                        No lookups yet.
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
