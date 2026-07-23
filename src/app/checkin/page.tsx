"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "@/components/QrScanner";
import ManualSearch from "@/components/ManualSearch";
import CheckinResultCard, { type ScanResult } from "@/components/CheckinResultCard";
import LiabilityFormCapture from "@/components/LiabilityFormCapture";

type Role = "admin" | "oc_scan" | "oc_helpdesk" | null;

export default function CheckinPage() {
  const [role, setRole] = useState<Role>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [liabilityDelegate, setLiabilityDelegate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const lockedRef = useRef(false);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => setRole(data.role))
      .catch(() => setRole(null));
  }, []);

  // oc_scan only ever sees the scanner; oc_helpdesk only ever sees manual
  // search (they have no QR to scan). Admin gets both, with the toggle.
  const scannerAllowed = role === "admin" || role === "oc_scan";
  const manualAllowed = role === "admin" || role === "oc_helpdesk";
  const toggleVisible = role === "admin";
  const manualForced = role === "oc_helpdesk";

  const performCheckin = useCallback(async (id: string, method: "qr" | "manual") => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setManualOpen(false);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, method }),
      });
      const data = await res.json();

      if (res.status === 404 || data.status === "not_found") {
        setResult({ type: "not_found" });
      } else if (data.status === "duplicate") {
        setResult({ type: "duplicate", delegate: data.delegate });
      } else {
        setResult({ type: "success", delegate: data.delegate });
      }
    } catch {
      setResult({ type: "not_found" });
    }
  }, []);

  const confirmResult = useCallback(() => {
    if (result && result.type !== "not_found") {
      setLiabilityDelegate({ id: result.delegate.id, name: result.delegate.name });
    } else {
      lockedRef.current = false;
    }
    setResult(null);
  }, [result]);

  const finishLiabilityStep = useCallback(() => {
    setLiabilityDelegate(null);
    lockedRef.current = false;
  }, []);

  const showManual = manualForced || (manualAllowed && manualOpen);
  const showScanner = scannerAllowed && !showManual && !liabilityDelegate;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Delegate Check-in</h1>
        <p className="text-warm-white/50">
          {manualForced
            ? "Search for a delegate to check them in."
            : "Point a delegate's QR code at the camera."}
        </p>
      </div>

      {showScanner && <QrScanner onScan={(id) => performCheckin(id, "qr")} />}

      {toggleVisible && (
        <div className="text-center mt-8">
          <button
            onClick={() => setManualOpen((v) => !v)}
            className="rounded-2xl bg-warm-white/[0.06] hover:bg-warm-white/[0.1] border border-warm-white/15 px-8 py-4 text-lg font-bold transition-colors"
          >
            {manualOpen ? "Back to Scanner" : "Forgot QR? Search Manually"}
          </button>
        </div>
      )}

      {showManual && (
        <div className="mt-8">
          <ManualSearch onSelect={(id) => performCheckin(id, "manual")} />
        </div>
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
