import { NextRequest, NextResponse } from "next/server";
import { setDayPresence } from "@/lib/db";

export const dynamic = "force-dynamic";

// Used by the /attendance roll-call page. Reachable by admin and both OC
// roles (falls under /api/delegates/:path* in middleware's allowlist) —
// unlike /uncheckin, this doesn't need an admin-only + password gate: it's
// a direct, immediately-correctable tick on today's (or a selected) day,
// not an irreversible override of someone else's action.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const day = body.day;
  const present = body.present;
  const checkedInBy = typeof body.checkedInBy === "string" ? body.checkedInBy.trim() : "";

  if (day !== 1 && day !== 2 && day !== 3) {
    return NextResponse.json({ error: "day must be 1, 2, or 3." }, { status: 400 });
  }
  if (typeof present !== "boolean") {
    return NextResponse.json({ error: "present must be a boolean." }, { status: 400 });
  }

  try {
    const delegate = await setDayPresence(params.id, day, present, checkedInBy);
    if (!delegate) {
      return NextResponse.json({ error: "Delegate not found." }, { status: 404 });
    }
    return NextResponse.json({ delegate });
  } catch (err) {
    console.error("setDayPresence failed:", err);
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }
}
