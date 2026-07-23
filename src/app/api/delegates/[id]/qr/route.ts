import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getDelegateById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const delegate = await getDelegateById(params.id);
  if (!delegate) {
    return NextResponse.json({ error: "Delegate not found" }, { status: 404 });
  }

  const buffer = await QRCode.toBuffer(delegate.id, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
  });

  const headers: Record<string, string> = {
    "Content-Type": "image/png",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  };

  if (req.nextUrl.searchParams.get("download") === "1") {
    headers["Content-Disposition"] = `attachment; filename="oakridge-mun-qr-${delegate.id}.png"`;
  }

  return new NextResponse(new Uint8Array(buffer), { headers });
}
