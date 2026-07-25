import { NextResponse } from "next/server";
import { getCurrentConferenceDay } from "@/lib/db";

export const dynamic = "force-dynamic";

// Server-computed (IST) rather than left to each device's local clock —
// staff phones set to the wrong timezone would otherwise mark attendance
// under the wrong day.
export async function GET() {
  return NextResponse.json({ day: getCurrentConferenceDay() });
}
