import { NextResponse } from "next/server";
import { getQrLookupStats } from "@/lib/db";

export async function GET() {
  const stats = await getQrLookupStats();
  return NextResponse.json(stats);
}
