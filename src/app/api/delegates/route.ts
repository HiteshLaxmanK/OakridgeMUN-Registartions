import { NextRequest, NextResponse } from "next/server";
import { searchDelegates, getFacets } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const committee = searchParams.get("committee") || undefined;
  const school = searchParams.get("school") || undefined;
  const country = searchParams.get("country") || undefined;
  const checkedInParam = searchParams.get("checkedIn");
  const checkedIn =
    checkedInParam === "true" || checkedInParam === "false"
      ? checkedInParam
      : undefined;

  const delegates = await searchDelegates({ q, committee, school, country, checkedIn });
  const facets = await getFacets();

  return NextResponse.json({ delegates, facets });
}
