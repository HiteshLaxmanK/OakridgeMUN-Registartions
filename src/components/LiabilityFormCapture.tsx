"use client";

import { useEffect, useRef, useState } from "react";

export default function LiabilityFormCapture({
  delegateId,
  delegateName,
  onDone,
}: {
  delegateId: string;
  delegateName: string;
  onDone: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pages, setPages] = useState<[string | null, string | null]>([null, null]);
  const [pageIndex, setPageIndex] = useState<0 | 1>(0);
  const [saving, setSaving] = useState(false);
  const captured = pages[pageIndex];

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera API unavailable in this browser.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            "Could not access camera. Check permissions and that no other app is using it."
          );
          console.error("Liability form camera failed", err);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    // Cap the long edge at 1600px — plenty legible for a signed document,
    // but keeps each photo a few hundred KB instead of multi-MB at native
    // phone-camera resolution, so two uploads + server-side PDF embedding
    // finish comfortably inside a serverless function's time limit even
    // on slow venue wifi.
    const MAX_DIMENSION = 1600;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPages((prev) => {
      const next: [string | null, string | null] = [...prev];
      next[pageIndex] = dataUrl;
      return next;
    });
  }

  function handleRetake() {
    setSaveError(null);
    setPages((prev) => {
      const next: [string | null, string | null] = [...prev];
      next[pageIndex] = null;
      return next;
    });
  }

  function handleNextPage() {
    setSaveError(null);
    setPageIndex(1);
  }

  function handlePrevPage() {
    setSaveError(null);
    setPageIndex(0);
  }

  async function handleSave() {
    if (!pages[0] || !pages[1]) return;
    setSaving(true);
    setSaveError(null);
    // Abort a hung upload (bad venue wifi) instead of "Saving..." forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const formData = new FormData();
      const blob1 = await (await fetch(pages[0])).blob();
      const blob2 = await (await fetch(pages[1])).blob();
      formData.append("file", blob1, "liability-form-1.jpg");
      formData.append("file", blob2, "liability-form-2.jpg");
      const res = await fetch(`/api/delegates/${delegateId}/liability-form`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Save failed");
      onDone();
    } catch (err) {
      console.error("Failed to save liability form", err);
      setSaveError("Could not save the form. Check your connection and try again.");
      setSaving(false);
    } finally {
      clearTimeout(timeout);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-xl text-center my-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-teal mb-2">
          Step 2 of 2 &middot; Page {pageIndex + 1} of 2
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-1">Liability Form</h2>
        <p className="text-warm-white/50 mb-6">{delegateName}</p>

        <div className="w-full aspect-square max-h-[55vh] rounded-3xl overflow-hidden border-4 border-teal/30 bg-black shadow-2xl shadow-navy/60 relative mb-6">
          {/* Kept permanently mounted so its srcObject binding survives
              Retake — swapping it for an <img> would unmount and lose the
              live camera stream. */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${captured ? "hidden" : ""}`}
            playsInline
            muted
          />
          {captured && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={captured}
              alt="Captured liability form"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy/95 p-8 text-center">
              <p className="text-bright-red font-semibold">{error}</p>
            </div>
          )}
        </div>

        {saveError && (
          <p className="text-bright-red font-semibold mb-4">{saveError}</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {!captured ? (
            <button
              onClick={handleCapture}
              disabled={!!error}
              className="rounded-2xl bg-teal text-navy font-extrabold text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 hover:bg-teal/90 transition-colors disabled:opacity-50"
            >
              Capture
            </button>
          ) : (
            <>
              <button
                onClick={handleRetake}
                disabled={saving}
                className="rounded-2xl bg-warm-white/10 border border-warm-white/20 font-bold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover:bg-warm-white/15 transition-colors disabled:opacity-50"
              >
                Retake
              </button>
              {pageIndex === 1 && (
                <button
                  onClick={handlePrevPage}
                  disabled={saving}
                  className="rounded-2xl bg-warm-white/10 border border-warm-white/20 font-bold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover:bg-warm-white/15 transition-colors disabled:opacity-50"
                >
                  Back to Page 1
                </button>
              )}
              {pageIndex === 0 ? (
                <button
                  onClick={handleNextPage}
                  className="rounded-2xl bg-teal text-navy font-extrabold text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 hover:bg-teal/90 transition-colors"
                >
                  Next Page &rarr;
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-2xl bg-teal text-navy font-extrabold text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 hover:bg-teal/90 transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save & Continue"}
                </button>
              )}
            </>
          )}
        </div>

        <button
          onClick={onDone}
          className="mt-6 text-sm font-semibold text-warm-white/40 hover:text-warm-white/70 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
