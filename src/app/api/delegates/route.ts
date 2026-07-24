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
  const liabilityFormParam = searchParams.get("liabilityForm");
  const liabilityForm =
    liabilityFormParam === "true" || liabilityFormParam === "false"
      ? liabilityFormParam
      : undefined;
  const methodParam = searchParams.get("method");
  const method =
    methodParam === "qr" || methodParam === "manual" ? methodParam : undefined;

  // Facets (the distinct committee/school/country lists for filter dropdowns)
  // require a second full-table scan and only the dashboard's filter UI
  // needs them — every manual-search keystroke was paying for one anyway,
  // sequentially after the actual search query, roughly doubling latency
  // for no reason.
  const includeFacets = searchParams.get("includeFacets") === "1";
  const excludeTest = searchParams.get("excludeTest") === "1";

  const [delegates, facets] = await Promise.all([
    searchDelegates({ q, committee, school, country, checkedIn, liabilityForm, method, excludeTest }),
    includeFacets ? getFacets() : Promise.resolve({ committees: [], schools: [], countries: [] }),
  ]);

  return NextResponse.json({ delegates, facets });
}
