"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/import", label: "Import" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/checkin", label: "Check-in" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const isProtected = LINKS.some((link) => link.href === pathname);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-6 py-3 border-b border-warm-white/10 bg-navy shadow-lg shadow-navy/50">
      <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Image
          src="/oakmun-logo.png"
          alt="Oakridge MUN"
          width={40}
          height={40}
          className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
          priority
        />
        <span className="hidden sm:flex flex-col leading-tight">
          <span className="text-lg font-extrabold tracking-tight text-warm-white">
            Oakridge <span className="text-teal">MUN</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-warm-white/40">
            Check-in
          </span>
        </span>
      </Link>
      <div className="flex gap-1 sm:gap-2 overflow-x-auto">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                active
                  ? "bg-teal text-navy"
                  : "text-warm-white/70 hover:text-warm-white hover:bg-warm-white/5"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        {isProtected && (
          <button
            onClick={handleLogout}
            className="px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap text-warm-white/50 hover:text-bright-red hover:bg-warm-white/5 transition-colors"
          >
            Log Out
          </button>
        )}
      </div>
    </nav>
  );
}
