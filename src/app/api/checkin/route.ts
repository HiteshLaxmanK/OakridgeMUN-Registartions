import { NextRequest, NextResponse } from "next/server";
import { checkInDelegate } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id.trim() : "";

  if (!id) {
    return NextResponse.json({ error: "Missing delegate id." }, { status: 400 });
  }

  const result = await checkInDelegate(id);

  if (result.status === "not_found") {
    return NextResponse.json(
      { status: "not_found", error: "No delegate matches this QR code." },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
