export default function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "teal" | "gold" | "red";
}) {
  const accentClass =
    accent === "gold"
      ? "text-warm-gold"
      : accent === "red"
      ? "text-bright-red"
      : "text-teal";

  return (
    <div className="rounded-2xl border border-warm-white/10 bg-navy shadow-lg shadow-navy/40 px-6 py-6">
      <p className={`text-4xl font-extrabold tabular-nums ${accentClass}`}>{value}</p>
      <p className="text-xs uppercase tracking-widest text-warm-white/40 mt-2 font-semibold">
        {label}
      </p>
    </div>
  );
}
