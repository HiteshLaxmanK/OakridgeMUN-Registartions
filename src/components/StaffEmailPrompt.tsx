"use client";

import { useState, type FormEvent } from "react";

export default function StaffEmailPrompt({
  onSubmit,
}: {
  onSubmit: (email: string) => void;
}) {
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    onSubmit(email);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy p-4 sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm text-center rounded-3xl border border-warm-white/10 bg-warm-white/[0.03] p-8"
      >
        <h2 className="text-2xl font-extrabold mb-2">Who&apos;s checking in?</h2>
        <p className="text-warm-white/50 mb-6">
          Enter your email once — this device will remember it for every check-in you do.
        </p>
        <input
          autoFocus
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@oakridge.in"
          className="w-full rounded-2xl bg-warm-white/[0.06] border border-warm-white/15 px-5 py-4 text-lg placeholder:text-warm-white/30 focus:outline-none focus:border-teal/60 mb-4 text-center"
        />
        <button
          type="submit"
          className="w-full rounded-2xl bg-teal text-navy font-extrabold text-lg px-8 py-4 hover:bg-teal/90 transition-colors"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
