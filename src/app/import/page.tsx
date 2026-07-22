"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Delegate } from "@/lib/types";
import QrModal from "@/components/QrModal";

interface ImportSummary {
  inserted: number;
  skipped: number;
  total: number;
}

export default function ImportPage() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrDelegate, setQrDelegate] = useState<Delegate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/delegates");
    const data = await res.json();
    setDelegates(data.delegates || []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed.");
      } else {
        setSummary(data);
        await refresh();
      }
    } catch {
      setError("Something went wrong while importing the file.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleMockData() {
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch("/api/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 220 }),
      });
      const data = await res.json();
      setSummary(data);
      await refresh();
    } catch {
      setError("Could not generate mock data.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!confirm("This will delete all delegates. Continue?")) return;
    setBusy(true);
    try {
      await fetch("/api/reset", { method: "POST" });
      setSummary(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold mb-2">Import Allocation Matrix</h1>
      <p className="text-warm-white/50 mb-8">
        Upload a CSV or Excel file with columns: Name, Email, School, Committee,
        Country. Each delegate gets a random UUID and a QR code containing only
        that UUID.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="rounded-2xl border border-warm-white/10 bg-warm-white/[0.03] shadow-lg shadow-navy/40 p-8">
          <h2 className="font-bold text-lg mb-3">Upload File</h2>
          <p className="text-warm-white/40 text-sm mb-5">
            Accepts .csv, .xlsx, .xls
          </p>
          <label className="block">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={busy}
              className="block w-full text-sm text-warm-white/70 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:font-bold file:bg-teal file:text-navy hover:file:bg-teal/90 file:cursor-pointer cursor-pointer disabled:opacity-50"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-warm-white/10 bg-warm-white/[0.03] shadow-lg shadow-navy/40 p-8">
          <h2 className="font-bold text-lg mb-3">No file handy?</h2>
          <p className="text-warm-white/40 text-sm mb-5">
            Generate ~220 realistic mock delegates across 10 committees.
          </p>
          <button
            onClick={handleMockData}
            disabled={busy}
            className="rounded-xl bg-warm-gold text-navy font-bold px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Generate Mock Data
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-bright-red/10 border border-bright-red/40 text-bright-red px-5 py-4 mb-8 font-semibold">
          {error}
        </div>
      )}

      {summary && (
        <div className="rounded-xl bg-teal/10 border border-teal/30 px-5 py-4 mb-8 flex gap-8 flex-wrap">
          <div>
            <p className="text-2xl font-extrabold text-teal">{summary.inserted}</p>
            <p className="text-xs uppercase tracking-widest text-warm-white/40">Imported</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-warm-white/60">{summary.skipped}</p>
            <p className="text-xs uppercase tracking-widest text-warm-white/40">
              Skipped (duplicate/invalid)
            </p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-warm-white">{summary.total}</p>
            <p className="text-xs uppercase tracking-widest text-warm-white/40">
              Total Delegates
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          Delegates <span className="text-warm-white/40 font-normal">({delegates.length})</span>
        </h2>
        {delegates.length > 0 && (
          <button
            onClick={handleReset}
            disabled={busy}
            className="text-sm font-semibold text-bright-red/80 hover:text-bright-red transition-colors disabled:opacity-50"
          >
            Reset all data
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-warm-white/10 shadow-lg shadow-navy/40 overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-warm-white/[0.04] sticky top-0">
              <tr className="text-left text-warm-white/40 uppercase text-xs tracking-widest">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">School</th>
                <th className="px-5 py-3">Committee</th>
                <th className="px-5 py-3">Country</th>
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
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setQrDelegate(d)}
                      className="text-teal font-semibold hover:underline"
                    >
                      View QR
                    </button>
                  </td>
                </tr>
              ))}
              {delegates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-warm-white/30">
                    No delegates yet. Upload a file or generate mock data above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {qrDelegate && (
        <QrModal delegate={qrDelegate} onClose={() => setQrDelegate(null)} />
      )}
    </div>
  );
}
