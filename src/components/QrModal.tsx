"use client";

import type { Delegate } from "@/lib/types";

export default function QrModal({
  delegate,
  onClose,
}: {
  delegate: Delegate;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-6"
      onClick={onClose}
    >
      <div
        className="bg-warm-white text-navy rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl shadow-navy/60 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-dark-teal mb-1">
          {delegate.committee || "Unassigned"}
        </p>
        <h3 className="text-xl font-extrabold mb-4">{delegate.name}</h3>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/delegates/${delegate.id}/qr`}
          alt={`QR code for ${delegate.name}`}
          className="mx-auto mb-4 rounded-lg border border-navy/10"
          width={280}
          height={280}
        />
        <p className="text-xs tracking-wide text-navy/50 break-all mb-6">
          {delegate.id}
        </p>
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-navy text-warm-white font-bold py-3 hover:bg-navy/90 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
