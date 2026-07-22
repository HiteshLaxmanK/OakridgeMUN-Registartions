import { NextResponse } from "next/server";
import { resetDelegates } from "@/lib/db";

export async function POST() {
  await resetDelegates();
  return NextResponse.json({ ok: true });
}
