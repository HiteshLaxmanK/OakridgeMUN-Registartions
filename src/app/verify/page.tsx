"use client";

import ManualSearch from "@/components/ManualSearch";

export default function VerifyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Verify Check-in</h1>
        <p className="text-warm-white/50">
          Look up a delegate to confirm whether they&apos;ve already checked in.
        </p>
      </div>
      <ManualSearch readOnly />
    </div>
  );
}
