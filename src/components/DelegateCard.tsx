import type { Delegate } from "@/lib/types";

export default function DelegateCard({
  delegate,
  onCheckIn,
  onUndoCheckIn,
}: {
  delegate: Delegate;
  onCheckIn: (id: string) => void;
  onUndoCheckIn?: (id: string) => void;
}) {
  return (
    <div className="p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold truncate">{delegate.name}</p>
          <p className="text-xs text-warm-white/50 truncate">
            {delegate.committee}
            {delegate.country ? ` · ${delegate.country}` : ""}
          </p>
          {delegate.school && (
            <p className="text-xs text-warm-white/40 truncate">{delegate.school}</p>
          )}
        </div>
        {!delegate.checkedIn && (
          <button
            onClick={() => onCheckIn(delegate.id)}
            className="shrink-0 rounded-lg bg-teal text-navy text-xs font-bold px-3 py-2"
          >
            Check In
          </button>
        )}
        {delegate.checkedIn && onUndoCheckIn && (
          <button
            onClick={() => onUndoCheckIn(delegate.id)}
            className="shrink-0 rounded-lg bg-bright-red/15 text-bright-red text-xs font-bold px-3 py-2"
          >
            Undo
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            delegate.checkedIn
              ? "bg-teal/15 text-teal"
              : "bg-warm-white/5 text-warm-white/40"
          }`}
        >
          {delegate.checkedIn
            ? `✓ Checked In${delegate.checkedInMethod === "manual" ? " (Manual)" : ""}`
            : "Not Checked In"}
        </span>
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            delegate.liabilityFormOnFile
              ? "bg-warm-gold/15 text-warm-gold"
              : "bg-warm-white/5 text-warm-white/40"
          }`}
        >
          {delegate.liabilityFormOnFile ? "✓ Form Uploaded" : "No Form"}
        </span>
        {delegate.liabilityFormOnFile && (
          <a
            href={`/api/delegates/${delegate.id}/liability-form`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-teal/10 text-teal"
          >
            View PDF
          </a>
        )}
      </div>
    </div>
  );
}
