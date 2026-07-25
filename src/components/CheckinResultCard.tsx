"use client";

import { useState } from "react";
import type { Delegate } from "@/lib/types";

export type ScanResult =
  | { type: "success"; delegate: Delegate; day?: 1 | 2 | 3 }
  | { type: "duplicate"; delegate: Delegate; day?: 1 | 2 | 3 }
  | { type: "not_found" }
  | { type: "error"; message?: string };

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-3 sm:gap-8 border-b border-warm-white/15 pb-3 last:border-0 last:pb-0">
      <span className="text-warm-white/70 font-bold uppercase text-xs tracking-widest shrink-0">
        {label}
      </span>
      <span className="text-warm-white text-lg sm:text-3xl font-extrabold text-right">
        {value}
      </span>
    </div>
  );
}

export default function CheckinResultCard({
  result,
  onConfirm,
}: {
  result: ScanResult;
  onConfirm: () => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if ((result.type === "success" || result.type === "duplicate") && note.trim()) {
      setSaving(true);
      try {
        await fetch(`/api/delegates/${result.delegate.id}/note`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note }),
        });
      } finally {
        setSaving(false);
      }
    }
    onConfirm();
  }

  if (result.type === "error") {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-warm-gold animate-pop-in overflow-y-auto p-4 sm:p-8">
        <div className="text-center w-full max-w-2xl my-auto">
          <p className="text-7xl sm:text-9xl mb-6">⟳</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy mb-3">
            Connection Problem
          </h2>
          <p className="text-navy/80 text-lg sm:text-xl mb-10">
            {result.message ||
              "Couldn't reach the server. The delegate may be valid — please scan again."}
          </p>
          <button
            onClick={onConfirm}
            className="rounded-2xl bg-navy text-warm-white font-extrabold text-xl sm:text-2xl px-12 sm:px-16 py-4 sm:py-5 hover:bg-navy/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (result.type === "not_found") {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-bright-red animate-pop-in overflow-y-auto p-4 sm:p-8">
        <div className="text-center w-full max-w-2xl my-auto">
          <p className="text-7xl sm:text-9xl mb-6">✕</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-warm-white mb-3">
            QR Not Recognized
          </h2>
          <p className="text-warm-white/80 text-lg sm:text-xl mb-10">
            This code doesn&apos;t match any imported delegate.
          </p>
          <button
            onClick={onConfirm}
            className="rounded-2xl bg-warm-white text-bright-red font-extrabold text-xl sm:text-2xl px-12 sm:px-16 py-4 sm:py-5 hover:bg-warm-white/90 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  const isDuplicate = result.type === "duplicate";
  const d = result.delegate;
  const dayLabel = result.day ? ` — Day ${result.day}` : "";

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center animate-pop-in overflow-y-auto p-4 sm:p-8 ${
        isDuplicate ? "bg-bright-red" : "bg-dark-teal"
      }`}
    >
      <div className="text-center w-full max-w-2xl my-auto">
        <p className="text-7xl sm:text-9xl mb-4 leading-none">{isDuplicate ? "⚠" : "✓"}</p>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-warm-white mb-6 sm:mb-10">
          {isDuplicate ? `Already Checked In Today${dayLabel}` : `Checked In${dayLabel}`}
        </h2>
        <div className="bg-navy/40 rounded-2xl px-5 sm:px-10 py-6 sm:py-8 space-y-3 sm:space-y-4 mb-6">
          <Row label="Name" value={d.name} />
          <Row label="School" value={d.school || "—"} />
          <Row label="Committee" value={d.committee || "—"} />
          <Row label="Country" value={d.country || "—"} />
          <Row
            label={isDuplicate ? "Checked In At" : "Time"}
            value={formatTime(d.checkedInAt)}
          />
          <div className="flex justify-between items-baseline gap-3 sm:gap-8">
            <span className="text-warm-white/70 font-bold uppercase text-xs tracking-widest shrink-0">
              Liability Form
            </span>
            <span
              className={`text-lg sm:text-2xl font-extrabold text-right ${
                d.liabilityFormOnFile ? "text-teal" : "text-warm-gold"
              }`}
            >
              {d.liabilityFormOnFile ? "✓ On File" : "✕ Missing"}
            </span>
          </div>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Additional info (optional) — e.g. missing badge, name mismatch..."
          rows={2}
          className="w-full rounded-xl bg-navy/40 border border-warm-white/20 text-warm-white placeholder:text-warm-white/50 px-5 py-3 text-base mb-6 focus:outline-none focus:border-warm-white/60 resize-none"
        />

        <button
          onClick={handleConfirm}
          disabled={saving}
          className="rounded-2xl bg-warm-white text-navy font-extrabold text-xl sm:text-2xl px-14 sm:px-20 py-4 sm:py-5 hover:bg-warm-white/90 transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : "OK"}
        </button>
      </div>
    </div>
  );
}
