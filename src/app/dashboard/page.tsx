"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Delegate, Stats } from "@/lib/types";
import StatCard from "@/components/StatCard";
import CommitteeProgressList from "@/components/CommitteeProgressList";
import RecentCheckins from "@/components/RecentCheckins";
import DelegateCard from "@/components/DelegateCard";
import PasswordPrompt from "@/components/PasswordPrompt";
import CheckinResultCard, { type ScanResult } from "@/components/CheckinResultCard";
import LiabilityFormCapture from "@/components/LiabilityFormCapture";

const POLL_MS = 3000;
const SEARCH_DEBOUNCE_MS = 300;

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
  const [liabilityForm, setLiabilityForm] = useState<"" | "true" | "false">("");
  const [method, setMethod] = useState<"" | "qr" | "manual">("");
  const searchSectionRef = useRef<HTMLHeadingElement>(null);

  const [passwordFor, setPasswordFor] = useState<
    { id: string; name: string; mode: "checkin" | "uncheckin" } | null
  >(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [liabilityDelegate, setLiabilityDelegate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => setRole(data.role))
      .catch(() => setRole(null));
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/stats");
    setStats(await res.json());
  }, []);

  const fetchDelegates = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("includeFacets", "1");
    params.set("excludeTest", "1");
    if (q) params.set("q", q);
    if (committee) params.set("committee", committee);
    if (school) params.set("school", school);
    if (checkedIn) params.set("checkedIn", checkedIn);
    if (liabilityForm) params.set("liabilityForm", liabilityForm);
    if (method) params.set("method", method);

    const res = await fetch(`/api/delegates?${params.toString()}`);
    const data = await res.json();
    setDelegates(data.delegates || []);
    setFacets(data.facets || { committees: [], schools: [], countries: [] });
  }, [q, committee, school, checkedIn, liabilityForm, method]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    // Debounced so typing in the search box (or flipping a filter) doesn't
    // fire an API call on every keystroke/click.
    const t = setTimeout(fetchDelegates, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [fetchDelegates]);

  useEffect(() => {
    const interval = setInterval(fetchDelegates, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchDelegates]);

  function selectCommittee(c: string) {
    setCommittee(c);
    if (c) {
      searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function requestManualCheckIn(id: string) {
    const d = delegates.find((x) => x.id === id);
    setPasswordFor({ id, name: d?.name || "this delegate", mode: "checkin" });
  }

  function requestUndoCheckIn(id: string) {
    const d = delegates.find((x) => x.id === id);
    setPasswordFor({ id, name: d?.name || "this delegate", mode: "uncheckin" });
  }

  async function submitManualCheckIn(password: string): Promise<string | null> {
    if (!passwordFor) return null;
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: passwordFor.id, method: "manual", password }),
      });
      const data = await res.json();

      if (res.status === 401) {
        return data.error || "Incorrect password.";
      }
      if (res.status === 404 || data.status === "not_found") {
        setResult({ type: "not_found" });
      } else if (!res.ok) {
        return data.error || "Check-in service unavailable. Try again.";
      } else if (data.status === "duplicate") {
        setResult({ type: "duplicate", delegate: data.delegate });
      } else {
        setResult({ type: "success", delegate: data.delegate });
      }
      setPasswordFor(null);
      fetchDelegates();
      fetchStats();
      return null;
    } catch {
      return "Something went wrong. Try again.";
    }
  }

  async function submitUndoCheckIn(password: string): Promise<string | null> {
    if (!passwordFor) return null;
    try {
      const res = await fetch(`/api/delegates/${passwordFor.id}/uncheckin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.status === 401) {
        return data.error || "Incorrect password.";
      }
      if (!res.ok) {
        return data.error || "Could not undo check-in. Try again.";
      }
      setPasswordFor(null);
      fetchDelegates();
      fetchStats();
      return null;
    } catch {
      return "Something went wrong. Try again.";
    }
  }

  const confirmResult = useCallback(() => {
    if (result && (result.type === "success" || result.type === "duplicate")) {
      setLiabilityDelegate({ id: result.delegate.id, name: result.delegate.name });
    }
    setResult(null);
  }, [result]);

  const finishLiabilityStep = useCallback(() => {
    setLiabilityDelegate(null);
    fetchDelegates();
    fetchStats();
  }, [fetchDelegates, fetchStats]);

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

      <div className="max-w-[1700px] mx-auto px-6 py-12">
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
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, school, country, committee, email..."
          className="sm:flex-1 sm:min-w-[240px] rounded-xl bg-navy border border-warm-white/10 px-4 py-3 text-sm placeholder:text-warm-white/30 focus:outline-none focus:border-teal/60 transition-colors"
        />
        <select
          value={committee}
          onChange={(e) => setCommittee(e.target.value)}
          className="rounded-xl bg-navy border border-warm-white/10 px-4 py-3 text-sm focus:outline-none focus:border-teal/60 transition-colors"
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
          className="rounded-xl bg-navy border border-warm-white/10 px-4 py-3 text-sm focus:outline-none focus:border-teal/60 transition-colors"
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
          className="rounded-xl bg-navy border border-warm-white/10 px-4 py-3 text-sm focus:outline-none focus:border-teal/60 transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="true">Checked In</option>
          <option value="false">Not Checked In</option>
        </select>
        <select
          value={liabilityForm}
          onChange={(e) => setLiabilityForm(e.target.value as "" | "true" | "false")}
          className="rounded-xl bg-navy border border-warm-white/10 px-4 py-3 text-sm focus:outline-none focus:border-teal/60 transition-colors"
        >
          <option value="">All Liability Forms</option>
          <option value="true">Form Submitted</option>
          <option value="false">Form Not Submitted</option>
        </select>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as "" | "qr" | "manual")}
          className="rounded-xl bg-navy border border-warm-white/10 px-4 py-3 text-sm focus:outline-none focus:border-teal/60 transition-colors"
        >
          <option value="">Any Check-in Method</option>
          <option value="qr">Checked In via QR</option>
          <option value="manual">Checked In Manually</option>
        </select>
      </div>

      <div className="rounded-2xl border border-warm-white/10 shadow-lg shadow-navy/40 overflow-hidden bg-navy">
        {/* Mobile: stacked cards. A wide table doesn't fit a phone screen
            without breaking layout or forcing awkward horizontal scrolling,
            so below md it's replaced with cards instead. */}
        <div className="md:hidden max-h-[70vh] overflow-y-auto divide-y divide-warm-white/5 transition-opacity duration-150">
          {delegates.map((d) => (
            <DelegateCard
              key={d.id}
              delegate={d}
              onCheckIn={requestManualCheckIn}
              onUndoCheckIn={role === "admin" ? requestUndoCheckIn : undefined}
            />
          ))}
          {delegates.length === 0 && (
            <p className="px-5 py-10 text-center text-warm-white/30 text-sm">
              No delegates match your search.
            </p>
          )}
        </div>

        <div className="hidden md:block max-h-[480px] overflow-y-auto transition-opacity duration-150">
          <table className="w-full text-sm">
            <thead className="bg-navy sticky top-0">
              <tr className="text-left text-warm-white/40 uppercase text-xs tracking-widest">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Committee</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Method</th>
                {role === "admin" && <th className="px-4 py-3">Checked In By</th>}
                <th className="px-4 py-3">Liability Form</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {delegates.map((d) => (
                <tr key={d.id} className="border-t border-warm-white/5 hover:bg-warm-white/[0.02]">
                  <td className="px-4 py-3 font-medium max-w-[220px] truncate" title={d.name}>
                    {d.name}
                  </td>
                  <td
                    className="px-4 py-3 text-warm-white/60 max-w-[200px] truncate"
                    title={d.school}
                  >
                    {d.school}
                  </td>
                  <td className="px-4 py-3 text-warm-white/60 whitespace-nowrap">
                    {d.committee}
                  </td>
                  <td
                    className="px-4 py-3 text-warm-white/60 max-w-[260px] truncate"
                    title={d.country}
                  >
                    {d.country}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {d.checkedIn ? (
                      <span className="text-teal font-semibold">✓ Checked In</span>
                    ) : (
                      <span className="text-warm-white/30">Not Checked In</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {d.checkedInMethod ? (
                      <span className="text-warm-white/60">
                        {d.checkedInMethod === "qr" ? "QR Scan" : "Manual"}
                      </span>
                    ) : (
                      <span className="text-warm-white/30">—</span>
                    )}
                  </td>
                  {role === "admin" && (
                    <td
                      className="px-4 py-3 text-warm-white/60 max-w-[200px] truncate"
                      title={d.checkedInBy || undefined}
                    >
                      {d.checkedInBy || <span className="text-warm-white/30">—</span>}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {d.liabilityFormOnFile ? (
                      <a
                        href={`/api/delegates/${d.id}/liability-form`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-warm-gold font-semibold hover:underline"
                      >
                        ✓ Uploaded — View PDF
                      </a>
                    ) : (
                      <span className="text-warm-white/30">Not Uploaded</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {!d.checkedIn && (
                      <button
                        onClick={() => requestManualCheckIn(d.id)}
                        className="text-teal font-semibold hover:underline"
                      >
                        Check In
                      </button>
                    )}
                    {d.checkedIn && role === "admin" && (
                      <button
                        onClick={() => requestUndoCheckIn(d.id)}
                        className="text-bright-red/80 font-semibold hover:underline"
                      >
                        Undo Check-in
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

      {passwordFor && passwordFor.mode === "checkin" && (
        <PasswordPrompt
          delegateName={passwordFor.name}
          onCancel={() => setPasswordFor(null)}
          onSubmit={submitManualCheckIn}
        />
      )}

      {passwordFor && passwordFor.mode === "uncheckin" && (
        <PasswordPrompt
          delegateName={passwordFor.name}
          onCancel={() => setPasswordFor(null)}
          onSubmit={submitUndoCheckIn}
          eyebrow="Undo Check-in"
          placeholder="Manual check-in password"
          description={
            <>
              Reversing the check-in for{" "}
              <span className="text-warm-white font-semibold">{passwordFor.name}</span>
              . They&apos;ll need to check in again.
            </>
          }
        />
      )}

      {result && <CheckinResultCard result={result} onConfirm={confirmResult} />}

      {liabilityDelegate && (
        <LiabilityFormCapture
          delegateId={liabilityDelegate.id}
          delegateName={liabilityDelegate.name}
          onDone={finishLiabilityStep}
        />
      )}
    </div>
  );
}
