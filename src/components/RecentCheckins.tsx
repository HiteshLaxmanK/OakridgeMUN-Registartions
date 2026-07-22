import type { Delegate } from "@/lib/types";

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function RecentCheckins({ delegates }: { delegates: Delegate[] }) {
  return (
    <div className="rounded-2xl border border-warm-white/10 bg-navy shadow-lg shadow-navy/40 p-6">
      <h2 className="font-bold text-lg mb-5">Recent Check-ins</h2>
      <div className="space-y-3 max-h-[360px] overflow-y-auto">
        {delegates.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between border-b border-warm-white/5 pb-3 last:border-0"
          >
            <div>
              <p className="font-semibold">{d.name}</p>
              <p className="text-xs text-warm-white/40">
                {d.committee} · {d.country}
              </p>
              {d.note && (
                <p className="text-xs text-warm-gold mt-1 italic">
                  &ldquo;{d.note}&rdquo;
                </p>
              )}
            </div>
            <p className="text-sm font-semibold text-teal tabular-nums">
              {formatTime(d.checkedInAt)}
            </p>
          </div>
        ))}
        {delegates.length === 0 && (
          <p className="text-warm-white/30 text-sm">No check-ins yet.</p>
        )}
      </div>
    </div>
  );
}
