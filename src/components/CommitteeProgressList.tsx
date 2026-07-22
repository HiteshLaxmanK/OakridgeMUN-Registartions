import type { CommitteeProgress } from "@/lib/types";

export default function CommitteeProgressList({
  committees,
  selected,
  onSelect,
}: {
  committees: CommitteeProgress[];
  selected?: string;
  onSelect?: (committee: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-warm-white/10 bg-navy shadow-lg shadow-navy/40 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-lg">Committee Progress</h2>
        {selected && (
          <button
            onClick={() => onSelect?.("")}
            className="text-xs font-semibold text-teal hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>
      <div className="space-y-4">
        {committees.map((c) => {
          const pct = c.total > 0 ? Math.round((c.checkedIn / c.total) * 100) : 0;
          const isSelected = selected === c.committee;
          return (
            <button
              key={c.committee}
              onClick={() => onSelect?.(isSelected ? "" : c.committee)}
              className={`block w-full text-left rounded-lg px-2 py-1.5 -mx-2 transition-colors ${
                isSelected ? "bg-teal/10" : "hover:bg-warm-white/[0.04]"
              }`}
            >
              <div className="flex justify-between text-sm mb-1.5">
                <span
                  className={`font-semibold ${isSelected ? "text-teal" : ""}`}
                >
                  {c.committee}
                </span>
                <span className="text-warm-white/50 tabular-nums">
                  {c.checkedIn} / {c.total}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-warm-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
        {committees.length === 0 && (
          <p className="text-warm-white/30 text-sm">No committees yet.</p>
        )}
      </div>
    </div>
  );
}
