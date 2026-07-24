import { NextRequest, NextResponse } from "next/server";
import { undoCheckIn } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // /api/delegates/:path* is reachable by OC roles too (for search and
  // liability-form upload) — undoing a check-in is an admin-only action,
  // enforced here since the middleware's path allowlist is coarse.
  const role = req.headers.get("x-oakmun-role");
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const overridePassword = process.env.MANUAL_CHECKIN_PASSWORD || "";
  if (!overridePassword || password !== overridePassword) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  try {
    const delegate = await undoCheckIn(params.id);
    if (!delegate) {
      return NextResponse.json({ error: "Delegate not found." }, { status: 404 });
    }
    return NextResponse.json({ delegate });
  } catch (err) {
    console.error("undoCheckIn failed:", err);
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }
}
