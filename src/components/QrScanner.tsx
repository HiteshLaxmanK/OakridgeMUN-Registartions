"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const REGION_ID = "oakmun-qr-reader";

export default function QrScanner({
  onScan,
}: {
  onScan: (text: string) => void;
}) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    function fail(err: unknown) {
      if (cancelled) return;
      setCameraError(
        "Could not access camera. Check permissions and that no other app is using it."
      );
      console.error("Camera start failed", err);
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      fail(new Error("Camera API unavailable in this browser context."));
    } else {
      try {
        scanner = new Html5Qrcode(REGION_ID, { verbose: false });
        scanner
          .start(
            { facingMode: "environment" },
            { fps: 10 },
            (decodedText) => onScanRef.current(decodedText),
            () => {
              /* ignore per-frame decode misses */
            }
          )
          .catch(fail);
      } catch (err) {
        fail(err);
      }
    }

    return () => {
      cancelled = true;
      if (!scanner) return;
      try {
        Promise.resolve(scanner.stop())
          .then(() => scanner?.clear())
          .catch(() => {});
      } catch {
        // start() never completed, so stop() throws synchronously; nothing to tear down.
        try {
          scanner.clear();
        } catch {
          /* no-op */
        }
      }
    };
  }, []);

  return (
    <div className="w-full aspect-square max-h-[70vh] rounded-3xl overflow-hidden border-4 border-teal/30 bg-black shadow-2xl shadow-navy/60 relative max-w-xl mx-auto">
      <div id={REGION_ID} className="w-full h-full [&_video]:!w-full [&_video]:!h-full [&_video]:object-cover" />
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy/95 p-8 text-center">
          <p className="text-bright-red font-semibold">{cameraError}</p>
        </div>
      )}
    </div>
  );
}
