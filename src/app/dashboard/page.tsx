"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Delegate, Stats } from "@/lib/types";
import StatCard from "@/components/StatCard";
import CommitteeProgressList from "@/components/CommitteeProgressList";
import RecentCheckins from "@/components/RecentCheckins";

const POLL_MS = 3000;

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [facets, setFacets] = useState<{
    committees: string[];
    schools: string[];
    countries: string[];
  }>({ committees: [], schools: [], countries: [] });

  const [q, setQ] = useState("");
  const [committee, setCommittee] = useState("");
  const [school, setSchool] = useState("");
  const [checkedIn, setCheckedIn] = useState<"" | "true" | "false">("");
  const searchSectionRef = useRef<HTMLHeadingElement>(null);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/stats");
    setStats(await res.json());
  }, []);

  const fetchDelegates = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (committee) params.set("committee", committee);
    if (school) params.set("school", school);
    if (checkedIn) params.set("checkedIn", checkedIn);

    const res = await fetch(`/api/delegates?${params.toString()}`);
    const data = await res.json();
    setDelegates(data.delegates || []);
    setFacets(data.facets || { committees: [], schools: [], countries: [] });
  }, [q, committee, school, checkedIn]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    fetchDelegates();
    const interval = setInterval(fetchDelegates, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchDelegates]);

  function selectCommittee(c: string) {
    setCommittee(c);
    if (c) {
      searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function manualCheckIn(id: string) {
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchDelegates();
    fetchStats();
  }

  return (
    <div className="relative">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src="/mun-poster.png"
          alt=""
          fill
          quality={40}
          className="object-cover object-bottom grayscale-[50%] brightness-[0.35] contrast-[0.9]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-teal/45 via-teal/50 to-teal/65" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-8">
        <StatCard label="Total Delegates" value={stats?.total ?? "—"} />
        <StatCard label="Checked In" value={stats?.checkedIn ?? "—"} accent="teal" />
        <StatCard label="Remaining" value={stats?.remaining ?? "—"} accent="gold" />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <CommitteeProgressList
          committees={stats?.committees ?? []}
          selected={committee}
          onSelect={selectCommittee}
        />
        <RecentCheckins delegates={stats?.recentCheckins ?? []} />
      </div>

      <h2 ref={searchSectionRef} className="text-xl font-bold mb-4 scroll-mt-6">
        Search Delegates
      </h2>
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, school, country, committee, email..."
          className="flex-1 min-w-[240px] rounded-xl bg-navy border border-warm-white/10 px-4 py-3 text-sm placeholder:text-warm-white/30 focus:outline-none focus:border-teal/60"
        />
        <select
          value={committee}
          onChange={(e) => setCommittee(e.target.value)}
          className="rounded-xl bg-navy border border-warm-white/10 px-4 py-3 text-sm focus:outline-none focus:border-teal/60"
        >
          <option value="">All Committees</option>
          {facets.committees.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          className="rounded-xl bg-navy border border-warm-white/10 px-4 py-3 text-sm focus:outline-none focus:border-teal/60"
        >
          <option value="">All Schools</option>
          {facets.schools.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={checkedIn}
          onChange={(e) => setCheckedIn(e.target.value as "" | "true" | "false")}
          className="rounded-xl bg-navy border border-warm-white/10 px-4 py-3 text-sm focus:outline-none focus:border-teal/60"
        >
          <option value="">All Statuses</option>
          <option value="true">Checked In</option>
          <option value="false">Not Checked In</option>
        </select>
      </div>

      <div className="rounded-2xl border border-warm-white/10 shadow-lg shadow-navy/40 overflow-hidden bg-navy">
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy sticky top-0">
              <tr className="text-left text-warm-white/40 uppercase text-xs tracking-widest">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">School</th>
                <th className="px-5 py-3">Committee</th>
                <th className="px-5 py-3">Country</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Liability Form</th>
                <th className="px-5 py-3">PDF</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {delegates.map((d) => (
                <tr key={d.id} className="border-t border-warm-white/5 hover:bg-warm-white/[0.02]">
                  <td className="px-5 py-3 font-medium">{d.name}</td>
                  <td className="px-5 py-3 text-warm-white/60">{d.school}</td>
                  <td className="px-5 py-3 text-warm-white/60">{d.committee}</td>
                  <td className="px-5 py-3 text-warm-white/60">{d.country}</td>
                  <td className="px-5 py-3">
                    {d.checkedIn ? (
                      <span className="text-teal font-semibold">✓ Checked In</span>
                    ) : (
                      <span className="text-warm-white/30">Not Checked In</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {d.liabilityFormOnFile ? (
                      <span className="text-warm-gold font-semibold">✓ Uploaded</span>
                    ) : (
                      <span className="text-warm-white/30">Not Uploaded</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {d.liabilityFormOnFile ? (
                      <a
                        href={`/api/delegates/${d.id}/liability-form`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal font-semibold hover:underline"
                      >
                        View PDF
                      </a>
                    ) : (
                      <span className="text-warm-white/30">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {!d.checkedIn && (
                      <button
                        onClick={() => manualCheckIn(d.id)}
                        className="text-teal font-semibold hover:underline"
                      >
                        Check In
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {delegates.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-warm-white/30">
                    No delegates match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
