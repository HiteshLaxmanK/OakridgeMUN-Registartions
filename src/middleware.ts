import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const expected = await sessionToken(process.env.ADMIN_PASSWORD || "");
  const authed = !!cookie && cookie === expected;

  if (authed) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/",
    "/import",
    "/dashboard",
    "/checkin",
    "/api/import",
    "/api/reset",
    "/api/checkin",
    "/api/stats",
    "/api/delegates",
    "/api/delegates/:path*",
  ],
};
