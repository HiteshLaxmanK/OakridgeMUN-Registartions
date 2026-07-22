import { NextRequest, NextResponse } from "next/server";
import { insertDelegates, resetDelegates } from "@/lib/db";
import { generateMockDelegates } from "@/lib/mockData";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const count = typeof body.count === "number" ? body.count : 220;

  await resetDelegates();
  const rows = generateMockDelegates(count);
  const result = await insertDelegates(rows);

  return NextResponse.json(result);
}
