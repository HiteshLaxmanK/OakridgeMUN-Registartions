"use client";

import { useState, type FormEvent } from "react";

export default function PasswordPrompt({
  delegateName,
  onCancel,
  onSubmit,
}: {
  delegateName: string;
  onCancel: () => void;
  onSubmit: (password: string) => Promise<string | null>;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    const err = await onSubmit(password);
    if (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy/90 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-navy border border-warm-white/15 shadow-2xl shadow-navy/60 p-8 text-center"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-teal mb-2">
          Manual Check-in
        </p>
        <h2 className="text-xl font-extrabold mb-1">Confirm Password</h2>
        <p className="text-warm-white/50 text-sm mb-6">
          Checking in{" "}
          <span className="text-warm-white font-semibold">{delegateName}</span> without
          scanning their QR code.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Manual check-in password"
          autoFocus
          className="w-full rounded-xl bg-warm-white/[0.06] border border-warm-white/15 px-4 py-3 text-base mb-4 focus:outline-none focus:border-teal/60"
        />
        {error && (
          <p className="text-bright-red text-sm font-semibold mb-4">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl bg-warm-white/10 border border-warm-white/20 font-bold py-3 hover:bg-warm-white/15 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !password}
            className="flex-1 rounded-xl bg-teal text-navy font-bold py-3 hover:bg-teal/90 transition-colors disabled:opacity-50"
          >
            {busy ? "Checking..." : "Confirm"}
          </button>
        </div>
      </form>
    </div>
  );
}
