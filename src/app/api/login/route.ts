import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "";
  const ocScanPassword = process.env.OC_SCAN_DESK_PASSWORD || "";
  const ocHelpdeskPassword = process.env.OC_HELP_DESK_PASSWORD || "";

  let role: "admin" | "oc_scan" | "oc_helpdesk" | null = null;
  if (adminPassword && password === adminPassword) role = "admin";
  else if (ocScanPassword && password === ocScanPassword) role = "oc_scan";
  else if (ocHelpdeskPassword && password === ocHelpdeskPassword) role = "oc_helpdesk";

  if (!role) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await sessionToken(password);
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
