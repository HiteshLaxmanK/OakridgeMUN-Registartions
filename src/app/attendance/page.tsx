"use client";

import { useEffect, useState } from "react";
import type { Delegate } from "@/lib/types";
import StaffEmailPrompt from "@/components/StaffEmailPrompt";
import { useStaffEmail } from "@/lib/useStaffEmail";

type Day = 1 | 2 | 3;

function dayField(delegate: Delegate, day: Day): boolean {
  if (day === 1) return delegate.day1Present;
  if (day === 2) return delegate.day2Present;
  return delegate.day3Present;
}

export default function AttendancePage() {
  const [role, setRole] = useState<string | null>(null);
  const { staffEmail, loaded: staffEmailLoaded, setStaffEmail, clearStaffEmail } = useStaffEmail();

  const [committees, setCommittees] = useState<string[]>([]);
  const [committee, setCommittee] = useState("");
  const [day, setDay] = useState<Day>(1);
  const [defaultDay, setDefaultDay] = useState<Day | null>(null);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => setRole(data.role))
      .catch(() => setRole(null));
  }, []);

  useEffect(() => {
    fetch("/api/current-day")
      .then((res) => res.json())
      .then((data) => {
        setDefaultDay(data.day);
        setDay(data.day);
      })
      .catch(() => {
        setDefaultDay(1);
        setDay(1);
      });
  }, []);

  useEffect(() => {
    fetch("/api/delegates?includeFacets=1&excludeTest=1")
      .then((res) => res.json())
      .then((data) => setCommittees(data.facets?.committees || []))
      .catch(() => setCommittees([]));
  }, []);

  useEffect(() => {
    if (!committee) {
      setDelegates([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/delegates?committee=${encodeURIComponent(committee)}&excludeTest=1`)
      .then((res) => res.json())
      .then((data) => setDelegates((data.delegates || []).sort((a: Delegate, b: Delegate) => a.name.localeCompare(b.name))))
      .catch(() => setError("Could not load delegates. Try again."))
      .finally(() => setLoading(false));
  }, [committee]);

  async function toggle(d: Delegate) {
    setPending(d.id);
    setError(null);
    const present = !dayField(d, day);
    try {
      const res = await fetch(`/api/delegates/${d.id}/day-presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, present, checkedInBy: staffEmail || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update attendance. Try again.");
        return;
      }
      setDelegates((prev) => prev.map((x) => (x.id === d.id ? data.delegate : x)));
    } catch {
      setError("Connection problem. Try again.");
    } finally {
      setPending(null);
    }
  }

  const needsStaffEmail = role === "oc_scan" || role === "oc_helpdesk";
  const staffGateActive = needsStaffEmail && staffEmailLoaded && !staffEmail;
  const presentCount = delegates.filter((d) => dayField(d, day)).length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {staffGateActive && <StaffEmailPrompt onSubmit={setStaffEmail} />}

      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold mb-2">Attendance</h1>
        <p className="text-warm-white/50">Select a committee and tick off who&apos;s present.</p>
        {needsStaffEmail && staffEmail && (
          <p className="text-xs text-warm-white/30 mt-2">
            Signed in as {staffEmail} ·{" "}
            <button onClick={clearStaffEmail} className="underline hover:text-warm-white/60">
              change
            </button>
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={committee}
          onChange={(e) => setCommittee(e.target.value)}
          className="flex-1 rounded-xl bg-warm-white/[0.06] border border-warm-white/15 px-4 py-3 text-base focus:outline-none focus:border-teal/60"
        >
          <option value="">Select a committee...</option>
          {committees.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="flex rounded-xl border border-warm-white/15 overflow-hidden shrink-0">
          {([1, 2, 3] as Day[]).map((n) => (
            <button
              key={n}
              onClick={() => setDay(n)}
              className={`px-4 py-3 text-sm font-bold transition-colors ${
                day === n
                  ? "bg-teal text-navy"
                  : "bg-warm-white/[0.06] text-warm-white/60 hover:bg-warm-white/[0.1]"
              }`}
            >
              Day {n}
              {defaultDay === n && day !== n && <span className="text-[10px] block opacity-70">(today)</span>}
            </button>
          ))}
        </div>

        <a
          href={committee ? `/api/export?committee=${encodeURIComponent(committee)}` : undefined}
          aria-disabled={!committee}
          className={`shrink-0 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
            committee
              ? "bg-teal/10 border-teal/40 text-teal hover:bg-teal/20"
              : "bg-warm-white/[0.04] border-warm-white/10 text-warm-white/30 pointer-events-none"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5v9M4 7l4 4 4-4M2.5 13.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download Committee Attendance
        </a>
      </div>

      {committee && (
        <p className="text-warm-white/40 text-sm mb-3">
          {presentCount} / {delegates.length} present — Day {day}
        </p>
      )}

      {error && (
        <p className="text-bright-red font-semibold text-center py-3 mb-3 rounded-xl bg-bright-red/10">
          {error}
        </p>
      )}

      {loading && <p className="text-warm-white/30 text-center py-8">Loading...</p>}

      <div className="space-y-2">
        {delegates.map((d) => {
          const present = dayField(d, day);
          return (
            <label
              key={d.id}
              className={`flex items-center gap-4 w-full text-left rounded-xl border px-5 py-4 cursor-pointer transition-colors ${
                present
                  ? "bg-teal/10 border-teal/40"
                  : "bg-warm-white/[0.04] border-warm-white/10 hover:bg-warm-white/[0.07]"
              } ${pending === d.id ? "opacity-50" : ""}`}
            >
              <input
                type="checkbox"
                checked={present}
                disabled={pending !== null}
                onChange={() => toggle(d)}
                className="w-6 h-6 shrink-0 accent-teal"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">{d.name}</p>
                <p className="text-warm-white/50 text-sm truncate">{d.country}</p>
              </div>
              {present && <span className="text-teal text-xs font-semibold shrink-0">✓ Present</span>}
            </label>
          );
        })}
        {!loading && committee && delegates.length === 0 && (
          <p className="text-warm-white/30 text-center py-8">No delegates in this committee.</p>
        )}
      </div>
    </div>
  );
}
