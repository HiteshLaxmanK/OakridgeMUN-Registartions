import { NextRequest, NextResponse } from "next/server";
import { checkInDelegate } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const method = body.method === "manual" ? "manual" : "qr";
  const checkedInBy = typeof body.checkedInBy === "string" ? body.checkedInBy.trim() : "";

  if (!id) {
    return NextResponse.json({ error: "Missing delegate id." }, { status: 400 });
  }

  // Only the dashboard's manual override button sends a password — the
  // normal /checkin flow (QR scan or its own manual search) never does,
  // so this barrier only applies there.
  if (typeof body.password === "string") {
    const overridePassword = process.env.MANUAL_CHECKIN_PASSWORD || "";
    if (!overridePassword || body.password !== overridePassword) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
  }

  let result;
  try {
    result = await checkInDelegate(id, method, checkedInBy);
  } catch (err) {
    // Transient DB/network failure — return clean JSON with a 503 so the
    // client shows a "try again" prompt instead of falsely rejecting a
    // valid delegate as "not found".
    console.error("checkInDelegate failed:", err);
    return NextResponse.json(
      { error: "Check-in service temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }

  if (result.status === "not_found") {
    return NextResponse.json(
      { status: "not_found", error: "No delegate matches this QR code." },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
