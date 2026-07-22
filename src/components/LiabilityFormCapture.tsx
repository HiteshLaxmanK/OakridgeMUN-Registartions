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
  const [captured, setCaptured] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCaptured(canvas.toDataURL("image/jpeg", 0.85));
  }

  function handleRetake() {
    setCaptured(null);
  }

  async function handleSave() {
    if (!captured) return;
    setSaving(true);
    try {
      const blob = await (await fetch(captured)).blob();
      const formData = new FormData();
      formData.append("file", blob, "liability-form.jpg");
      const res = await fetch(`/api/delegates/${delegateId}/liability-form`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Save failed");
      onDone();
    } catch (err) {
      console.error("Failed to save liability form", err);
      setError("Could not save the form. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-xl text-center my-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-teal mb-2">
          Step 2 of 2
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-1">Liability Form</h2>
        <p className="text-warm-white/50 mb-6">{delegateName}</p>

        <div className="w-full aspect-square max-h-[55vh] rounded-3xl overflow-hidden border-4 border-teal/30 bg-black shadow-2xl shadow-navy/60 relative mb-6">
          {!captured ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={captured}
              alt="Captured liability form"
              className="w-full h-full object-cover"
            />
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy/95 p-8 text-center">
              <p className="text-bright-red font-semibold">{error}</p>
            </div>
          )}
        </div>

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
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-2xl bg-teal text-navy font-extrabold text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 hover:bg-teal/90 transition-colors disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save & Continue"}
              </button>
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
