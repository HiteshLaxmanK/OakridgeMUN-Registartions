"use client";

import { useState } from "react";
import type { Delegate } from "@/lib/types";

export type ScanResult =
  | { type: "success"; delegate: Delegate }
  | { type: "duplicate"; delegate: Delegate }
  | { type: "not_found" };

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
    <div className="flex justify-between items-baseline gap-8 border-b border-warm-white/15 pb-3 last:border-0 last:pb-0">
      <span className="text-warm-white/70 font-bold uppercase text-xs tracking-widest">
        {label}
      </span>
      <span className="text-warm-white text-3xl font-extrabold text-right">{value}</span>
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
    if (result.type !== "not_found" && note.trim()) {
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

  if (result.type === "not_found") {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-bright-red animate-pop-in">
        <div className="text-center px-8 w-full max-w-2xl">
          <p className="text-9xl mb-6">✕</p>
          <h2 className="text-4xl font-extrabold text-warm-white mb-3">
            QR Not Recognized
          </h2>
          <p className="text-warm-white/80 text-xl mb-10">
            This code doesn&apos;t match any imported delegate.
          </p>
          <button
            onClick={onConfirm}
            className="rounded-2xl bg-warm-white text-bright-red font-extrabold text-2xl px-16 py-5 hover:bg-warm-white/90 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  const isDuplicate = result.type === "duplicate";
  const d = result.delegate;

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center animate-pop-in ${
        isDuplicate ? "bg-bright-red" : "bg-dark-teal"
      }`}
    >
      <div className="text-center px-8 w-full max-w-2xl">
        <p className="text-9xl mb-4 leading-none">{isDuplicate ? "⚠" : "✓"}</p>
        <h2 className="text-5xl font-extrabold text-warm-white mb-10">
          {isDuplicate ? "Already Checked In" : "Checked In"}
        </h2>
        <div className="bg-navy/40 rounded-2xl px-10 py-8 space-y-4 mb-6">
          <Row label="Name" value={d.name} />
          <Row label="School" value={d.school || "—"} />
          <Row label="Committee" value={d.committee || "—"} />
          <Row label="Country" value={d.country || "—"} />
          <Row
            label={isDuplicate ? "Checked In At" : "Time"}
            value={formatTime(d.checkedInAt)}
          />
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
          className="rounded-2xl bg-warm-white text-navy font-extrabold text-2xl px-20 py-5 hover:bg-warm-white/90 transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : "OK"}
        </button>
      </div>
    </div>
  );
}
