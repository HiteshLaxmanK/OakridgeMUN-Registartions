"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "@/components/QrScanner";
import ManualSearch from "@/components/ManualSearch";
import CheckinResultCard, { type ScanResult } from "@/components/CheckinResultCard";
import LiabilityFormCapture from "@/components/LiabilityFormCapture";
import StaffEmailPrompt from "@/components/StaffEmailPrompt";
import { useStaffEmail } from "@/lib/useStaffEmail";

type Role = "admin" | "oc_scan" | "oc_helpdesk" | null;

export default function CheckinPage() {
  const [role, setRole] = useState<Role>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [liabilityDelegate, setLiabilityDelegate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const lockedRef = useRef(false);
  const { staffEmail, loaded: staffEmailLoaded, setStaffEmail, clearStaffEmail } = useStaffEmail();

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        setRole(data.role);
        // Help desk's entire job is manual registration for delegates
        // without a QR — default straight to search instead of making
        // them detour through the scanner every time the page loads.
        if (data.role === "oc_helpdesk") setManualOpen(true);
      })
      .catch(() => setRole(null));
  }, []);

  // oc_scan only ever sees the scanner. Admin and oc_helpdesk get both,
  // toggled with the button below.
  const scannerAllowed = role === "admin" || role === "oc_scan" || role === "oc_helpdesk";
  const manualAllowed = role === "admin" || role === "oc_helpdesk";
  const toggleVisible = role === "admin" || role === "oc_helpdesk";

  const performCheckin = useCallback(async (id: string, method: "qr" | "manual") => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    // Show a loading state in place, instead of yanking the UI back to the
    // scanner while the request is still in flight (that's what made manual
    // check-in feel laggy — the search box vanished with no feedback until
    // the network call resolved).
    setChecking(true);

    // Abort a hung request instead of freezing this scanning station.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, method, checkedInBy: staffEmail || undefined }),
        signal: controller.signal,
      });
      // A real 404 means the QR genuinely isn't a delegate. Any 5xx is a
      // server/DB hiccup — never tell staff a valid delegate is "not found".
      if (res.status === 404) {
        setResult({ type: "not_found" });
      } else if (!res.ok) {
        setResult({ type: "error" });
      } else {
        const data = await res.json();
        if (data.status === "not_found") {
          setResult({ type: "not_found" });
        } else if (data.status === "duplicate") {
          setResult({ type: "duplicate", delegate: data.delegate });
        } else {
          setResult({ type: "success", delegate: data.delegate });
        }
      }
    } catch {
      // Network drop or 15s timeout — recoverable, so prompt a rescan.
      setResult({ type: "error" });
    } finally {
      clearTimeout(timeout);
      setChecking(false);
    }
  }, [staffEmail]);

  const confirmResult = useCallback(() => {
    if (result && (result.type === "success" || result.type === "duplicate")) {
      setLiabilityDelegate({ id: result.delegate.id, name: result.delegate.name });
    } else {
      // not_found or error: release the lock so the next scan is accepted.
      lockedRef.current = false;
    }
    setResult(null);
  }, [result]);

  const finishLiabilityStep = useCallback(() => {
    setLiabilityDelegate(null);
    lockedRef.current = false;
  }, []);

  const showManual = manualAllowed && manualOpen;
  const showScanner = scannerAllowed && !showManual && !liabilityDelegate;

  // Only OC roles need to identify themselves — admin's own identity is
  // already known from their session, no separate prompt needed.
  const needsStaffEmail = role === "oc_scan" || role === "oc_helpdesk";
  const staffGateActive = needsStaffEmail && staffEmailLoaded && !staffEmail;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {staffGateActive && <StaffEmailPrompt onSubmit={setStaffEmail} />}

      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Delegate Check-in</h1>
        <p className="text-warm-white/50">
          {showManual
            ? "Search for a delegate to check them in."
            : "Point a delegate's QR code at the camera."}
        </p>
        {needsStaffEmail && staffEmail && (
          <p className="text-xs text-warm-white/30 mt-2">
            Signed in as {staffEmail} ·{" "}
            <button onClick={clearStaffEmail} className="underline hover:text-warm-white/60">
              change
            </button>
          </p>
        )}
      </div>

      {showScanner && <QrScanner onScan={(id) => performCheckin(id, "qr")} />}

      {toggleVisible && (
        <div className="text-center mt-8">
          <button
            onClick={() => setManualOpen((v) => !v)}
            className="rounded-2xl bg-warm-white/[0.06] hover:bg-warm-white/[0.1] border border-warm-white/15 px-8 py-4 text-lg font-bold transition-colors"
          >
            {role === "oc_helpdesk"
              ? manualOpen
                ? "Use Camera Scanner Instead"
                : "Back to Search"
              : manualOpen
                ? "Back to Scanner"
                : "Forgot QR? Search Manually"}
          </button>
        </div>
      )}

      {showManual && (
        <div className="mt-8">
          <ManualSearch onSelect={(id) => performCheckin(id, "manual")} />
        </div>
      )}

      {checking && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-teal/25 border-t-teal rounded-full animate-spin" />
            <p className="text-warm-white/70 font-semibold text-lg">Checking in...</p>
          </div>
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
