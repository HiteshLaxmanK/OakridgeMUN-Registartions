import Image from "next/image";
import Link from "next/link";

const CARDS = [
  {
    href: "/import",
    title: "Import Allocation Matrix",
    description:
      "Upload a CSV/Excel file of delegates, or generate mock data instantly.",
    icon: "📥",
  },
  {
    href: "/dashboard",
    title: "Admin Dashboard",
    description:
      "Live totals, committee progress, recent check-ins, search & filters.",
    icon: "📊",
  },
  {
    href: "/checkin",
    title: "Check-in Scanner",
    description:
      "Scan delegate QR codes with a webcam for instant registration.",
    icon: "📷",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-40"
        style={{
          background:
            "radial-gradient(circle at 50% -10%, rgba(48,205,215,0.18), transparent 60%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <Image
            src="/oakmun-logo.png"
            alt="Oakridge MUN"
            width={96}
            height={96}
            className="h-24 w-24 object-contain mx-auto mb-6 drop-shadow-[0_0_24px_rgba(48,205,215,0.25)]"
            priority
          />
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-teal mb-3">
            Local Prototype
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Oakridge MUN Delegate Check-in
          </h1>
          <p className="text-warm-white/50 text-lg max-w-xl mx-auto">
            Fast, queue-free registration. Import delegates, generate QR codes,
            and check people in under 5 seconds.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-warm-white/10 bg-warm-white/[0.03] p-8 shadow-lg shadow-navy/40 hover:bg-warm-white/[0.06] hover:border-teal/40 hover:-translate-y-0.5 transition-all"
            >
              <div className="text-4xl mb-5">{card.icon}</div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-teal transition-colors">
                {card.title}
              </h2>
              <p className="text-warm-white/50 text-sm leading-relaxed">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
