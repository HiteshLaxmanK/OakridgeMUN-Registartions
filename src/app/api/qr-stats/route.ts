import { NextResponse } from "next/server";
import { getQrLookupStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getQrLookupStats();
  return NextResponse.json(stats);
}
