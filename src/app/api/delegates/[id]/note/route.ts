import { NextRequest, NextResponse } from "next/server";
import { setDelegateNote } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const note = typeof body.note === "string" ? body.note : "";

  const delegate = await setDelegateNote(params.id, note);
  if (!delegate) {
    return NextResponse.json({ error: "Delegate not found" }, { status: 404 });
  }

  return NextResponse.json({ delegate });
}
