import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const role = req.headers.get("x-oakmun-role") || null;
  return NextResponse.json({ role });
}
