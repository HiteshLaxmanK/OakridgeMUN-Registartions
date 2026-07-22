"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Incorrect password.");
        return;
      }
      const dest = params.get("from") || "/dashboard";
      router.push(dest);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoFocus
        className="w-full rounded-xl bg-navy border border-warm-white/15 px-4 py-3 text-base focus:outline-none focus:border-teal/60"
      />
      {error && <p className="text-bright-red text-sm font-semibold">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-teal text-navy font-bold py-3 hover:bg-teal/90 transition-colors disabled:opacity-50"
      >
        {busy ? "Checking..." : "Log In"}
      </button>
    </form>
  );
}
