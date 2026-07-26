import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";

export type Role = "admin" | "oc_scan" | "oc_helpdesk";

// Paths each non-admin role may reach. Admin always has full access.
// A path matches if it equals the entry, or starts with "<entry>/"
// (so "/api/delegates" also covers "/api/delegates/:id/liability-form" etc).
const ROLE_ALLOWED_PATHS: Record<Exclude<Role, "admin">, string[]> = {
  oc_scan: [
    "/checkin",
    "/verify",
    "/attendance",
    "/api/checkin",
    "/api/delegates",
    "/api/stats",
    "/api/session",
    "/api/current-day",
    "/api/export",
  ],
  oc_helpdesk: [
    "/checkin",
    "/dashboard",
    "/verify",
    "/attendance",
    "/api/checkin",
    "/api/delegates",
    "/api/stats",
    "/api/session",
    "/api/current-day",
    "/api/export",
  ],
};

function pathAllowed(pathname: string, allowed: string[]): boolean {
  return allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  // The QR image itself only ever encodes a delegate's UUID (no personal
  // info), and the public oakridgemun.in lookup portal needs to load it
  // cross-origin via a plain <img> tag with no session cookie attached.
  if (req.nextUrl.pathname.endsWith("/qr")) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const [adminExpected, ocScanExpected, ocHelpdeskExpected] = await Promise.all([
    sessionToken(process.env.SUPER_ADMIN_PASSWORD || ""),
    sessionToken(process.env.OC_SCAN_DESK_PASSWORD || ""),
    sessionToken(process.env.OC_HELP_DESK_PASSWORD || ""),
  ]);

  let role: Role | null = null;
  if (cookie && cookie === adminExpected) role = "admin";
  else if (cookie && cookie === ocScanExpected) role = "oc_scan";
  else if (cookie && cookie === ocHelpdeskExpected) role = "oc_helpdesk";

  if (!role) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (role !== "admin" && !pathAllowed(req.nextUrl.pathname, ROLE_ALLOWED_PATHS[role])) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/checkin", req.url));
  }

  const headers = new Headers(req.headers);
  headers.set("x-oakmun-role", role);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/",
    "/import",
    "/dashboard",
    "/checkin",
    "/verify",
    "/qr-stats",
    "/attendance",
    "/api/import",
    "/api/reset",
    "/api/export",
    "/api/qr-stats",
    "/api/checkin",
    "/api/stats",
    "/api/session",
    "/api/current-day",
    "/api/delegates",
    "/api/delegates/:path*",
  ],
};
